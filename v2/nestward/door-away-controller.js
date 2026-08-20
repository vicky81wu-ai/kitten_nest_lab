commit 0fb5127bf96feba8e295f2ac97f59bac2298fcc3
Author: Codex <codex@openai.com>
Date:   Thu Aug 20 08:24:10 2026 +0300

    feat(nestward): add clean Door subsystem QA candidate

diff --git a/v2/nestward/door-away-controller.js b/v2/nestward/door-away-controller.js
new file mode 100644
index 0000000..7e34f40
--- /dev/null
+++ b/v2/nestward/door-away-controller.js
@@ -0,0 +1,362 @@
+import { DOOR_AWAY_CALIBRATION } from './world-model.js';
+import { DOOR_OCCLUSION_MODES } from './door-occlusion-controller.js';
+import { claimActorControl, releaseActorControl } from './actor-motion.js';
+
+const CONTROL_OWNER = 'doorAway';
+
+const makeRandom = (seed = 0x19a8d00d) => {
+  let value = seed >>> 0;
+  return () => {
+    value = (value * 1664525 + 1013904223) >>> 0;
+    return value / 4294967296;
+  };
+};
+
+const actorDistance = (a, b) => Math.hypot(a.x - b.x, (a.z - b.z) * 520);
+
+const PHASE_LABELS = Object.freeze({
+  idle: '在家',
+  nailiApproach: '奶栗走向门口',
+  nailiLeaving: '奶栗穿门',
+  companionDelay: '奶栗在外 · Hubby 等两秒',
+  hubbyApproach: 'Hubby 走向门口',
+  hubbyLeaving: 'Hubby 穿门',
+  outside: '两只都在门外 · 等小猫叫',
+  nailiReturningOutside: '奶栗正在回门口',
+  nailiReturningB: '奶栗正在进屋',
+  hubbyRecallDelay: '奶栗已回 · Hubby 等两秒',
+  hubbyReturningOutside: 'Hubby 正在回门口',
+  hubbyReturningB: 'Hubby 正在进屋'
+});
+
+export class DoorAwayController {
+  constructor(options) {
+    this.state = options.state;
+    this.occlusion = options.occlusion;
+    this.planner = options.planner || null;
+    this.navigateNormal = options.navigateNormal;
+    this.navigateExact = options.navigateExact;
+    this.stopActor = options.stopActor;
+    this.say = options.say || (() => {});
+    this.showHint = options.showHint || (() => {});
+    this.now = options.now || (() => performance.now() / 1000);
+    this.random = options.random || makeRandom();
+    this.calibration = options.calibration || DOOR_AWAY_CALIBRATION;
+    this.phase = 'idle';
+    this.actorPhases = { hubby: 'idle', naili: 'idle' };
+    this.nextWanderAt = { hubby: Infinity, naili: Infinity };
+    this.companionAt = Infinity;
+    this.savedActors = null;
+  }
+
+  get ready() {
+    return Boolean(this.occlusion?.ready && this.planner?.ready);
+  }
+
+  get active() {
+    return this.phase !== 'idle';
+  }
+
+  get status() {
+    return {
+      phase: this.phase,
+      label: PHASE_LABELS[this.phase] || this.phase,
+      actorPhases: { ...this.actorPhases },
+      ready: this.ready,
+      point1: this.calibration.point1,
+      point2: this.calibration.point2,
+      companionDelaySeconds: this.calibration.companionDelaySeconds
+    };
+  }
+
+  setPlanner(planner) {
+    this.planner = planner || null;
+  }
+
+  ownsActor(actor) {
+    return this.active && (actor === this.state.hubby || actor === this.state.naili);
+  }
+
+  isActorOutside(actor) {
+    const phase = this.actorPhases[actor?.id];
+    return phase === 'outside' || phase === 'returningOutside';
+  }
+
+  speechScriptFor(actor) {
+    if (actor === this.state.hubby && this.isActorOutside(actor)) return 'hubby.doorAway';
+    if (actor === this.state.naili && this.isActorOutside(actor)) return 'naili.doorAway';
+    return null;
+  }
+
+  blocksDoor(object) {
+    return this.active && object?.id === 'door';
+  }
+
+  saveActorState() {
+    const { hubby, naili } = this.state;
+    this.savedActors = {
+      hubby: {
+        speed: hubby.speed,
+        follow: hubby.follow,
+        action: hubby.action,
+        nextThink: hubby.nextThink
+      },
+      naili: {
+        speed: naili.speed,
+        summoned: naili.summoned,
+        action: naili.action,
+        nextThink: naili.nextThink
+      }
+    };
+  }
+
+  lockActor(actor) {
+    actor.mount = null;
+    actor.action = 'door-away-lock';
+    if (actor === this.state.hubby) actor.follow = false;
+    if (actor === this.state.naili) actor.summoned = false;
+  }
+
+  doorSpeed(actor, outside = false) {
+    const base = actor === this.state.naili ? 86 : 92;
+    const speed = base * this.calibration.moveSpeed;
+    return outside ? speed * this.calibration.outsideSpeedFactor : speed;
+  }
+
+  setOcclusion(actor, mode) {
+    if (!mode) this.occlusion.clearActor(actor.id);
+    else this.occlusion.setActorMode(actor.id, mode);
+  }
+
+  start() {
+    if (!this.ready || this.active) return false;
+    if (this.state.doorTravel) {
+      this.showHint('先等这次院门换场走完。', 2200);
+      return false;
+    }
+    if (this.state.scene.id !== 'indoor') {
+      this.showHint('要从室内院门开始溜奶栗。', 2400);
+      return false;
+    }
+    if (this.state.princessCarry?.active) {
+      this.showHint('先把小猫放下来，再带奶栗出门。', 2800);
+      return false;
+    }
+    if (this.state.naili.carried) {
+      this.showHint('先把奶栗放到地上。它这次要自己走。', 3000);
+      return false;
+    }
+    if (this.state.hubby.mount) {
+      this.showHint('Hubby 先从家具上站起来。', 2600);
+      return false;
+    }
+
+    const hubbyClaimed = claimActorControl(this.state.hubby, CONTROL_OWNER);
+    const nailiClaimed = claimActorControl(this.state.naili, CONTROL_OWNER);
+    if (!hubbyClaimed || !nailiClaimed) {
+      if (hubbyClaimed) releaseActorControl(this.state.hubby, CONTROL_OWNER);
+      if (nailiClaimed) releaseActorControl(this.state.naili, CONTROL_OWNER);
+      this.showHint('人物正在完成别的动作，稍后再出门。', 2400);
+      return false;
+    }
+
+    this.saveActorState();
+    this.say('小猫，我去溜奶栗。', 'hubby', 4200);
+    this.stopActor(this.state.hubby);
+    this.stopActor(this.state.naili);
+    this.lockActor(this.state.hubby);
+    this.lockActor(this.state.naili);
+    this.setOcclusion(this.state.hubby, null);
+    this.setOcclusion(this.state.naili, null);
+    this.phase = 'nailiApproach';
+    this.actorPhases.naili = 'approach';
+    this.navigateNormal(this.state.naili, this.calibration.point1,
+      () => this.beginNailiLeaving(), { exactTarget: true, facing: 'segment' });
+    return true;
+  }
+
+  beginNailiLeaving() {
+    if (this.phase !== 'nailiApproach') return;
+    const naili = this.state.naili;
+    this.phase = 'nailiLeaving';
+    this.actorPhases.naili = 'throughFrame';
+    naili.speed = this.doorSpeed(naili);
+    this.setOcclusion(naili, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
+    this.navigateExact(naili, [this.calibration.point2],
+      () => this.beginNailiOutside(), { facing: 'segment' });
+  }
+
+  beginNailiOutside() {
+    if (this.phase !== 'nailiLeaving') return;
+    const naili = this.state.naili;
+    this.phase = 'companionDelay';
+    this.actorPhases.naili = 'outside';
+    naili.x = this.calibration.point2.x;
+    naili.z = this.calibration.point2.z;
+    naili.speed = this.doorSpeed(naili, true);
+    this.setOcclusion(naili, DOOR_OCCLUSION_MODES.OUTSIDE);
+    this.nextWanderAt.naili = this.now() + .25;
+    this.companionAt = this.now() + this.calibration.companionDelaySeconds;
+  }
+
+  beginHubbyApproach() {
+    if (this.phase !== 'companionDelay') return;
+    const hubby = this.state.hubby;
+    this.phase = 'hubbyApproach';
+    this.actorPhases.hubby = 'approach';
+    this.lockActor(hubby);
+    this.navigateNormal(hubby, this.calibration.point1,
+      () => this.beginHubbyLeaving(), { exactTarget: true, facing: 'segment' });
+  }
+
+  beginHubbyLeaving() {
+    if (this.phase !== 'hubbyApproach') return;
+    const hubby = this.state.hubby;
+    this.phase = 'hubbyLeaving';
+    this.actorPhases.hubby = 'throughFrame';
+    hubby.speed = this.doorSpeed(hubby);
+    this.setOcclusion(hubby, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
+    this.navigateExact(hubby, [this.calibration.point2],
+      () => this.beginHubbyOutside(), { facing: 'segment' });
+  }
+
+  beginHubbyOutside() {
+    if (this.phase !== 'hubbyLeaving') return;
+    const hubby = this.state.hubby;
+    this.phase = 'outside';
+    this.actorPhases.hubby = 'outside';
+    hubby.x = this.calibration.point2.x;
+    hubby.z = this.calibration.point2.z;
+    hubby.speed = this.doorSpeed(hubby, true);
+    this.setOcclusion(hubby, DOOR_OCCLUSION_MODES.OUTSIDE);
+    this.nextWanderAt.hubby = this.now() + .3;
+    this.showHint('Hubby 和奶栗都在门外，会等小猫叫他们回来。', 3600);
+  }
+
+  chooseSeparatedPath(actor) {
+    const other = actor === this.state.hubby ? this.state.naili : this.state.hubby;
+    const otherDestination = other.path?.at(-1) || other;
+    let fallback = [];
+    for (let attempt = 0; attempt < 6; attempt += 1) {
+      const path = this.planner.randomPath(actor, this.random);
+      if (!path.length) continue;
+      fallback = path;
+      if (!this.isActorOutside(other) || actorDistance(path.at(-1), otherDestination) >= 58) return path;
+    }
+    return fallback;
+  }
+
+  wander(actor, time) {
+    if (!this.isActorOutside(actor) || actor.path.length || time < this.nextWanderAt[actor.id]) return;
+    const path = this.chooseSeparatedPath(actor);
+    if (path.length > 1) {
+      this.navigateExact(actor, path, () => {
+        this.nextWanderAt[actor.id] = this.now() + .32 + this.random() * .52;
+      }, { facing: 'segment' });
+    } else this.nextWanderAt[actor.id] = time + .42;
+  }
+
+  tick(time) {
+    if (!this.active) return;
+    if (this.phase === 'companionDelay' && time >= this.companionAt) this.beginHubbyApproach();
+    if (this.phase === 'hubbyRecallDelay' && time >= this.companionAt) this.beginHubbyRecall();
+    this.wander(this.state.naili, time);
+    this.wander(this.state.hubby, time);
+  }
+
+  recall() {
+    if (this.phase !== 'outside') {
+      if (this.active) this.showHint('还在穿门。等两只都出去再叫。', 2200);
+      return false;
+    }
+    this.say('来了。奶栗，回家。', 'hubby', 4200);
+    const naili = this.state.naili;
+    this.phase = 'nailiReturningOutside';
+    this.actorPhases.naili = 'returningOutside';
+    this.stopActor(naili);
+    this.lockActor(naili);
+    naili.speed = this.doorSpeed(naili, true);
+    const path = this.planner.pathToAnchor(naili);
+    this.navigateExact(naili, path.length ? path : [this.calibration.point2],
+      () => this.returnNailiThroughFrame(), { facing: 'segment' });
+    return true;
+  }
+
+  returnNailiThroughFrame() {
+    if (this.phase !== 'nailiReturningOutside') return;
+    const naili = this.state.naili;
+    this.phase = 'nailiReturningB';
+    this.actorPhases.naili = 'throughFrame';
+    naili.x = this.calibration.point2.x;
+    naili.z = this.calibration.point2.z;
+    naili.speed = this.doorSpeed(naili);
+    this.setOcclusion(naili, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
+    this.navigateExact(naili, [this.calibration.point1],
+      () => this.finishNailiReturn(), { facing: 'segment' });
+  }
+
+  finishNailiReturn() {
+    if (this.phase !== 'nailiReturningB') return;
+    this.stopActor(this.state.naili);
+    this.setOcclusion(this.state.naili, null);
+    this.actorPhases.naili = 'idle';
+    this.phase = 'hubbyRecallDelay';
+    this.companionAt = this.now() + this.calibration.companionDelaySeconds;
+  }
+
+  beginHubbyRecall() {
+    if (this.phase !== 'hubbyRecallDelay') return;
+    const hubby = this.state.hubby;
+    this.phase = 'hubbyReturningOutside';
+    this.actorPhases.hubby = 'returningOutside';
+    this.stopActor(hubby);
+    this.lockActor(hubby);
+    hubby.speed = this.doorSpeed(hubby, true);
+    const path = this.planner.pathToAnchor(hubby);
+    this.navigateExact(hubby, path.length ? path : [this.calibration.point2],
+      () => this.returnHubbyThroughFrame(), { facing: 'segment' });
+  }
+
+  returnHubbyThroughFrame() {
+    if (this.phase !== 'hubbyReturningOutside') return;
+    const hubby = this.state.hubby;
+    this.phase = 'hubbyReturningB';
+    this.actorPhases.hubby = 'throughFrame';
+    hubby.x = this.calibration.point2.x;
+    hubby.z = this.calibration.point2.z;
+    hubby.speed = this.doorSpeed(hubby);
+    this.setOcclusion(hubby, DOOR_OCCLUSION_MODES.THROUGH_FRAME);
+    this.navigateExact(hubby, [this.calibration.point1],
+      () => this.finishReturn(), { facing: 'segment' });
+  }
+
+  restoreActorState() {
+    const saved = this.savedActors;
+    const { hubby, naili } = this.state;
+    hubby.speed = saved?.hubby.speed || 182;
+    hubby.follow = Boolean(saved?.hubby.follow);
+    hubby.action = saved?.hubby.action || null;
+    hubby.nextThink = this.now() + 4;
+    naili.speed = saved?.naili.speed || 126;
+    naili.summoned = Boolean(saved?.naili.summoned);
+    naili.action = saved?.naili.action || null;
+    naili.nextThink = this.now() + 4;
+  }
+
+  finishReturn() {
+    if (this.phase !== 'hubbyReturningB') return;
+    this.stopActor(this.state.hubby);
+    this.setOcclusion(this.state.hubby, null);
+    this.restoreActorState();
+    releaseActorControl(this.state.hubby, CONTROL_OWNER);
+    releaseActorControl(this.state.naili, CONTROL_OWNER);
+    this.actorPhases.hubby = 'idle';
+    this.actorPhases.naili = 'idle';
+    this.nextWanderAt.hubby = Infinity;
+    this.nextWanderAt.naili = Infinity;
+    this.companionAt = Infinity;
+    this.savedActors = null;
+    this.phase = 'idle';
+    this.showHint('回来了。人和猫都归位。', 2800);
+  }
+}

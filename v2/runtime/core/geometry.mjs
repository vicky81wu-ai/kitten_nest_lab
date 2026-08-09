export function coverBox(rect, natural) {
  const boxWidth = Number(rect?.width || 0);
  const boxHeight = Number(rect?.height || 0);
  const naturalWidth = Number(natural?.width || 0);
  const naturalHeight = Number(natural?.height || 0);
  if (!boxWidth || !boxHeight || !naturalWidth || !naturalHeight) return null;

  const boxRatio = boxWidth / boxHeight;
  const imageRatio = naturalWidth / naturalHeight;
  let width = boxWidth;
  let height = boxHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (boxRatio > imageRatio) {
    height = boxWidth / imageRatio;
    offsetY = (boxHeight - height) / 2;
  } else {
    width = boxHeight * imageRatio;
    offsetX = (boxWidth - width) / 2;
  }

  return {
    left: Number(rect.left || 0) + offsetX,
    top: Number(rect.top || 0) + offsetY,
    width,
    height
  };
}

export function projectCoordinate({
  imageBox,
  stageRect,
  coordinate,
  elementSize = {},
  baselineHeight = 0
}) {
  if (!imageBox || !stageRect || !coordinate) return null;

  const anchor = coordinate.anchor || 'center';
  const explicitWidth = coordinate.width == null
    ? null
    : imageBox.width * Number(coordinate.width || 0);
  const measuredWidth = Number(elementSize.width || 0);
  const anchorWidth = explicitWidth ?? measuredWidth;
  const explicitHeight = coordinate.height == null
    ? null
    : imageBox.height * Number(coordinate.height || 0);
  const aspectHeight = coordinate.aspectRatio && explicitWidth
    ? explicitWidth / Number(coordinate.aspectRatio)
    : null;
  const measuredHeight = Number(elementSize.height || 0);
  const height = explicitHeight ?? aspectHeight ?? measuredHeight;
  const imageX = imageBox.left + imageBox.width * Number(coordinate.x || 0);
  const imageY = imageBox.top + imageBox.height * Number(coordinate.y || 0);
  let left = imageX;
  let top = imageY;

  if (anchor === 'center') {
    left -= anchorWidth / 2;
    top -= height / 2;
  } else if (anchor === 'bottomRight') {
    left -= anchorWidth;
    top -= height;
  } else if (anchor === 'bottomLeft') {
    top -= height;
  } else if (anchor === 'baselineTop') {
    top += Number(baselineHeight || 0) - height;
  }

  return {
    left: left - Number(stageRect.left || 0),
    top: top - Number(stageRect.top || 0),
    width: explicitWidth ?? 0,
    height: explicitHeight ?? aspectHeight,
    rotation: Number(coordinate.rotation || 0)
  };
}

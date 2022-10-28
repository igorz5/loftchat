export const createElementEx = (tag, className, root) => {
  const el = document.createElement(tag);
  if (className) {
    el.classList = Array.isArray(className) ? className.join(" ") : className;
  }

  if (root) {
    root.append(el);
  }
  return el;
};

export const formatParticipants = (amount) => {
  if (amount === 0) return "Никого нет";
  if (amount === 1) return `${amount} участник`;
  if (amount <= 4) return `${amount} участника`;

  return `${amount} участников`;
};

export const truncateText = (text, length, suffix) => {
  if (text.length <= length) return text;

  const end = length - suffix.length;
  const i = text.lastIndexOf(" ");
  let newText;
  if (i === -1) {
    newText = text.substring(0, end);
  } else {
    newText = text.substring(0, i, end);
    if (newText > end) {
      newText = newText.substring(newText, end);
    }
  }

  console.log(newText);

  return suffix ? `${newText}${suffix}` : newText;
};

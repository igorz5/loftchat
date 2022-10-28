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

export const truncateText = (text, length, suffix = "") => {
  if (text.length <= length) return text;

  const newText = text.substring(0, length - suffix.length);
  return `${newText}${suffix}`;
};

'use strict';

export function secondsToDurationString (s) {
  const years = Math.floor(s / 31557600);
  let remainder = s % 31557600;
  const months = Math.floor(remainder / 2592000);
  remainder %= 2592000;
  const days = Math.floor(remainder / 86400);
  remainder %= 86400;
  const hours = Math.floor(remainder / 3600);
  remainder %= 3600;
  const minutes = Math.floor(remainder / 60);
  const seconds = remainder % 60;

  var string = years ? `${years} an${years > 1 ? 's' : ''} ` : '';
  string += months ? `${months} mois ` : '';
  string += days ? `${days} jour${days > 1 ? 's' : ''} ` : '';
  string += hours ? `${hours} heure${hours > 1 ? 's' : ''} ` : '';
  string += minutes ? `${minutes} minute${minutes > 1 ? 's' : ''} ` : '';
  string += seconds ? `${seconds} seconde${seconds > 1 ? 's' : ''}` : '';

  return string.trim();
}

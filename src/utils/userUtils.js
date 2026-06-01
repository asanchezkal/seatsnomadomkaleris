export function deriveNameFromEmail(email) {
  const localPart = email.split('@')[0]
  return localPart
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

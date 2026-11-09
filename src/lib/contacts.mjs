export function cvContacts(site) {
  return ['email', 'homepage', 'github', 'linkedin', 'scholar']
    .filter(key => typeof site[key] === 'string' && site[key].trim())
    .map(key => {
      const value = site[key].trim();
      return {
        key,
        href: key === 'email' ? `mailto:${value}` : value,
        value: value.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      };
    });
}

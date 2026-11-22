/** Navigation entre onglets, et accès direct à un paramètre ou à une règle. */
export type TabId = 'simple' | 'params' | 'rules';

export function selectTab(tab: TabId): void {
  document.querySelectorAll<HTMLButtonElement>('nav [role=tab]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });
  document.querySelectorAll<HTMLElement>('.tab').forEach((section) => {
    section.hidden = section.id !== `tab-${tab}`;
  });
}

/** Ouvre l'onglet, fait défiler jusqu'à l'élément et le met en évidence un instant. */
export function reveal(tab: TabId, elementId: string): void {
  selectTab(tab);
  const el = document.getElementById(elementId);
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.add('flash');
  window.setTimeout(() => el.classList.remove('flash'), 1500);
}

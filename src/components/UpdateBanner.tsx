interface Props {
  actualitzat: string;
}

const formatData = new Intl.DateTimeFormat('ca-ES', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Madrid',
});

export default function UpdateBanner({ actualitzat }: Props) {
  let text = actualitzat;
  try {
    text = formatData.format(new Date(actualitzat));
  } catch {
    // Si la data no és vàlida, es mostra tal com ha arribat.
  }
  return (
    <p className="update-banner">
      Dades actualitzades: <strong>{text}</strong> · Font:{' '}
      <a href="https://www.fcf.cat" target="_blank" rel="noreferrer">
        fcf.cat
      </a>
    </p>
  );
}

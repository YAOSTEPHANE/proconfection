export function formatMongoError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Connexion MongoDB impossible.";
  }

  const message = error.message;

  if (message.includes("MONGODB_URI est manquant")) {
    return "Variable MONGODB_URI absente sur le serveur de production.";
  }
  if (message.includes("bad auth") || message.includes("Authentication failed")) {
    return "MongoDB : identifiants invalides (vérifiez MONGODB_URI et le mot de passe Atlas).";
  }
  if (message.includes("ENOTFOUND") || message.includes("querySrv")) {
    return "MongoDB : hôte introuvable (vérifiez l'URL du cluster Atlas).";
  }
  if (message.includes("IP") || message.includes("whitelist")) {
    return "MongoDB : adresse IP du serveur non autorisée dans Atlas (Network Access).";
  }

  return message;
}

export const DATABASE_ERROR_HEADER = "X-Database-Error";

export function databaseErrorHeaders(error: unknown): HeadersInit {
  return {
    [DATABASE_ERROR_HEADER]: encodeURIComponent(formatMongoError(error)),
  };
}

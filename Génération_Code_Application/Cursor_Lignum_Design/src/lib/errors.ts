export type AppErrorCode =
  | "WRONG_CREDENTIALS"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SYSTEM_ERROR";

export function describeError(code: string | null | undefined): {
  title: string;
  message: string;
} {
  switch (code) {
    case "WRONG_CREDENTIALS":
      return {
        title: "Connexion impossible",
        message: "Email/nom d’utilisateur ou mot de passe incorrect.",
      };
    case "UNAUTHORIZED":
      return {
        title: "Connexion requise",
        message: "Vous devez être connecté pour accéder à cette page.",
      };
    case "FORBIDDEN":
      return {
        title: "Accès refusé",
        message: "Vous n’avez pas les permissions nécessaires pour accéder à cette page.",
      };
    case "VALIDATION_ERROR":
      return {
        title: "Informations invalides",
        message: "Certains champs sont invalides. Vérifiez les informations et réessayez.",
      };
    case "NOT_FOUND":
      return {
        title: "Introuvable",
        message: "La ressource demandée est introuvable.",
      };
    default:
      return {
        title: "Erreur système",
        message:
          "Une erreur inattendue s’est produite. Réessayez, ou contactez le support si le problème persiste.",
      };
  }
}


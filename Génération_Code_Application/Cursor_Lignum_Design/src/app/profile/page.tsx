import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteAccountAction,
  removeProfilePictureAction,
  updateProfileAction,
  updateProfilePictureAction,
} from "./actions";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{
    updated?: string;
    error?: string;
    avatarUpdated?: string;
    avatarRemoved?: string;
    avatarError?: string;
  }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const sp = (await searchParams) ?? {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      points: true,
      balance: true,
      role: true,
      profileImageUrl: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const avatarSrc = user.profileImageUrl;
  const isLocalAvatar = avatarSrc?.startsWith("/");

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Mon profil</h1>
      <p className="mt-2 text-muted">
        Rôle: <span className="font-medium text-foreground">{user.role}</span> · Points:{" "}
        <span className="font-medium text-foreground">{user.points}</span> · Balance:{" "}
        <span className="font-medium text-foreground">{Number(user.balance).toFixed(2)} $</span>
      </p>

      {sp.updated === "1" ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Profil mis à jour avec succès.
        </div>
      ) : null}

      {sp.error === "1" ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de mettre à jour le profil. Vérifiez les champs.
        </div>
      ) : null}

      {sp.error === "exists" ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Ce nom d’utilisateur ou cet email est déjà utilisé.
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border border-border bg-surface p-8">
        <h2 className="font-serif text-2xl font-semibold">Photo de profil</h2>
        <p className="mt-2 text-sm text-muted">
          Ajoutez une image via un lien externe ou en téléversant un fichier local.
        </p>

        {sp.avatarUpdated === "1" ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Photo de profil mise à jour.
          </div>
        ) : null}

        {sp.avatarRemoved === "1" ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Photo de profil supprimée.
          </div>
        ) : null}

        {sp.avatarError === "1" ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Impossible de mettre à jour la photo. Vérifiez l’URL ou le fichier.
          </div>
        ) : null}

        {sp.avatarError === "size" ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            L’image est trop volumineuse (max 5 Mo).
          </div>
        ) : null}

        {sp.avatarError === "empty" ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Fournissez une URL ou sélectionnez un fichier.
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border border-border bg-border/40">
            {avatarSrc ? (
              isLocalAvatar ? (
                <Image
                  src={avatarSrc}
                  alt="Photo de profil"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="Photo de profil" className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-serif text-muted">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <form action={updateProfilePictureAction} className="space-y-4">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Image (lien externe)</span>
                <input
                  name="imageUrl"
                  type="url"
                  placeholder="https://..."
                  defaultValue={
                    avatarSrc && !isLocalAvatar ? avatarSrc : ""
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium">Image (fichier local)</span>
                <input
                  name="imageFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>

              <p className="text-xs text-muted">
                Si vous fournissez un lien et un fichier, le lien sera utilisé en priorité.
                Formats acceptés : PNG, JPEG, WebP (max 5 Mo).
              </p>

              <button
                type="submit"
                className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Mettre à jour la photo
              </button>
            </form>

            {avatarSrc ? (
              <form action={removeProfilePictureAction} className="mt-4">
                <button
                  type="submit"
                  className="text-sm font-medium text-muted underline underline-offset-4"
                >
                  Supprimer la photo
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-8">
        <h2 className="font-serif text-2xl font-semibold">Informations</h2>
        <form action={updateProfileAction} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Prénom</label>
              <input
                name="firstName"
                defaultValue={user.firstName ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Nom</label>
              <input
                name="lastName"
                defaultValue={user.lastName ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nom d’utilisateur</label>
            <input
              name="username"
              required
              defaultValue={user.username}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={user.email}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Téléphone</label>
            <input
              name="phone"
              defaultValue={user.phone ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nouveau mot de passe (optionnel)</label>
            <input
              name="newPassword"
              type="password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              placeholder="Laissez vide pour ne pas changer"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Mettre à jour
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-8">
        <h2 className="font-serif text-2xl font-semibold text-red-700">Zone dangereuse</h2>
        <p className="mt-2 text-sm text-muted">
          La suppression de votre compte est définitive.
        </p>
        <form action={deleteAccountAction} className="mt-6">
          <button
            type="submit"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            Supprimer mon compte
          </button>
        </form>
      </div>
    </div>
  );
}

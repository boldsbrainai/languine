import "server-only";

import { CodeBlock } from "@/components/ui/code-block";
import { Logo } from "@/components/logo";
import { isOwnerRequest } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getBaseUrl(): Promise<string | null> {
  if (process.env.LANGUINE_BASE_URL) return process.env.LANGUINE_BASE_URL;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) return null;

  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export default async function CliTokenPage() {
  const requestHeaders = new Headers(await headers());
  if (!isOwnerRequest(requestHeaders)) {
    notFound();
  }

  const apiKey = process.env.LANGUINE_API_KEY ?? "";
  const baseUrl = await getBaseUrl();
  const interactiveLogin = baseUrl
    ? `npx languine@selfhosted login --url ${baseUrl}`
    : "Set LANGUINE_BASE_URL to your public deployment URL, then run: npx languine@selfhosted login --url <your-url>";
  const nonInteractiveExample = baseUrl
    ? `export LANGUINE_BASE_URL=${baseUrl}\nexport LANGUINE_API_KEY=${apiKey}\nnpx languine@selfhosted translate`
    : `export LANGUINE_BASE_URL=<your-public-url>\nexport LANGUINE_API_KEY=${apiKey}\nnpx languine@selfhosted translate`;
  const actionsExample = baseUrl
    ? `- uses: languine-ai/languine@v4
  with:
    api-key: \${{ secrets.LANGUINE_API_KEY }}
    base-url: ${baseUrl}
    project-id: prj_xxxxxxx`
    : `- uses: languine-ai/languine@v4
  with:
    api-key: \${{ secrets.LANGUINE_API_KEY }}
    base-url: \${{ vars.LANGUINE_BASE_URL }}
    project-id: prj_xxxxxxx`;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        <header>
          <Logo height={18} />
          <h1 className="text-xl mt-6">CLI token</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Copy the shared API key used by the CLI and CI for this deployment.
          </p>
        </header>

        {apiKey ? (
          <>
            <CodeBlock label="LANGUINE_API_KEY" value={apiKey} />

            <div className="space-y-3">
              <h2 className="text-sm font-medium">Interactive (recommended)</h2>
              <CodeBlock value={interactiveLogin} />
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-medium">
                Non-interactive (CI / scripts)
              </h2>
              <CodeBlock value={nonInteractiveExample} />
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-medium">GitHub Actions</h2>
              <CodeBlock value={actionsExample} />
            </div>
          </>
        ) : (
          <div className="border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <strong className="block mb-1">LANGUINE_API_KEY is not set.</strong>
            <p className="text-muted-foreground">
              Generate one with{" "}
              <code className="font-mono">openssl rand -hex 32</code>, set it
              in the app environment, then restart or redeploy the app.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

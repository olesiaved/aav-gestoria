# AAV Gestoría

Source for the [AAV Gestoría](https://aavgestoria.es/) website — a small business site for a gestoría (administrative/tax advisory) in Spain, published in Spanish and Russian.

The published site is **100% static HTML**. Pages are generated locally from Jinja2 templates and JSON content files, then the generated HTML is committed and served as-is — there's no runtime dependency on Python or Jinja2 in production.

## Structure

```
build.py           Static site generator (reads templates/ + content/, writes HTML to repo root and ru/)
templates/          Jinja2 templates (base.html + one per page type)
content/
  shared.json       Content shared across languages (nav labels, footer, contact info, etc.)
  es.json           Spanish page content
  ru.json           Russian page content
css/                Stylesheet
js/                 Client-side script
img/                Site images (favicons, logo, founder photo)
assets/             Source assets (originals, PDFs) — assets/processed/ holds optimized/derived versions used by img/
files/               Downloadable files linked from the site (e.g. PDFs)
*.html, ru/*.html    Generated output — Spanish pages at the repo root, Russian pages under ru/
```

## Building the site

Generated HTML pages are checked into the repo, so you only need to run the builder after editing a template or content file.

```bash
pip install jinja2
python3 build.py
```

This renders every page listed in `PAGES` (in `build.py`) for both `es` and `ru`, writing output to the paths declared there (e.g. `index.html` / `ru/index.html`), and prints the list of files written.

## Editing content

- **Text/copy**: edit `content/es.json` and `content/ru.json` (and `content/shared.json` for strings common to both languages), then rebuild.
- **Layout/markup**: edit the relevant file in `templates/`, then rebuild.
- **Styling**: edit `css/style.css` directly (not generated).

After rebuilding, commit both the source changes (templates/content) and the regenerated HTML output.

## Hosting on AWS (SST)

The site is deployed to AWS via [SST](https://sst.dev) (`sst.config.ts`), which
provisions a Route 53 hosted zone, S3 + CloudFront, and an ACM certificate,
and points them at `aavgestoria.es` — all as code, nothing clicked by hand in
the AWS console. `infra/build-static.sh` rebuilds the HTML and assembles just
the deployable files (`*.html`, `ru/`, `css/`, `js/`, `img/`, `files/`) into
`dist/`, which is what actually gets uploaded — source-only files
(`templates/`, `content/`, `build.py`) never reach S3.

### One-time setup

1. **AWS account**: install the AWS CLI and configure credentials for an IAM
   user/role with permissions to manage S3, CloudFront, ACM, Route 53, and
   IAM (`aws configure`, or an SSO profile). This is the one prerequisite SST
   can't set up for you — some AWS credential has to authorize the deploy.
2. **Install deploy tooling**:
   ```bash
   npm install
   ```
3. **Deploy once from your machine** (see below). This first run creates the
   Route 53 hosted zone, S3/CloudFront/ACM, and a GitHub OIDC deploy role,
   and prints two outputs you need:
   - `zoneNameServers` — the 4 Route 53 nameservers.
   - `githubDeployRoleArn` — the IAM role GitHub Actions will assume.
4. **Point your registrar at it**: copy the 4 nameservers into your domain's
   DNS/nameserver settings at your registrar (Namecheap, GoDaddy, etc.). This
   is the one step that can't be automated from AWS — it happens on a
   different company's system. Once propagated (can take a few hours),
   re-run the deploy and SST/ACM will finish validating the certificate
   automatically.
5. **Wire up CI**: in the repo's GitHub Settings → Secrets and variables →
   Actions, add a repository secret `AWS_DEPLOY_ROLE_ARN` set to the
   `githubDeployRoleArn` output from step 3.

### Deploying

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the
site and runs `sst deploy --stage production` using the OIDC role above — no
AWS keys stored in GitHub. You can also trigger it manually from the Actions
tab (`workflow_dispatch`), or run it locally:

```bash
npx sst deploy --stage production
```

The custom domain (`aavgestoria.es` and `www.aavgestoria.es`), hosted zone,
and deploy role are only created on the `production` stage — running
`npx sst dev` (no stage flag) spins up a throwaway preview stage on a
`*.sst.dev`-style URL for testing, without touching any of that.

To tear down a stage's AWS resources: `npx sst remove --stage <stage>`
(the `production` stage is protected against accidental removal).

Note: the GitHub deploy role is granted `AdministratorAccess` for now, since
scoping it down requires knowing every service the (still-growing) backend
will touch. Worth tightening once the backend's shape is settled. Also, an
AWS account can only have one GitHub OIDC provider — if this account already
has one (from another project), the first deploy will fail on that resource;
tell me and I'll adjust the config to reuse the existing provider instead of
creating a new one.

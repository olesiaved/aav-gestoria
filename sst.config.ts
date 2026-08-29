/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "aav-gestoria",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      home: "aws",
    };
  },
  async run() {
    const domainName = "aavgestoria.es";
    const githubRepo = "olesiaved/aav-gestoria";
    const stage = $app.stage;
    const isProd = stage === "production";
    // "dev" mirrors production one-to-one, just under a subdomain, so it's
    // a realistic environment to test backend changes against before they
    // hit the real site. Other ad-hoc stages (personal sandboxes, PR
    // previews) stay domain-less to avoid piling up DNS records.
    const isDev = stage === "dev";
    const hasDomain = isProd || isDev;

    // Created by SST rather than assumed to pre-exist. The domain itself is
    // registered elsewhere, so after the first deploy you still need to
    // copy this zone's 4 nameservers into your registrar's dashboard once
    // (see the `zoneNameServers` output) — that step lives outside AWS and
    // can't be automated from here.
    const zone = isProd ? new aws.route53.Zone("Zone", { name: domainName }) : undefined;

    // Lets GitHub Actions deploy without storing long-lived AWS keys as
    // repo secrets: the workflow authenticates via a short-lived OIDC token
    // instead, scoped to this repo. Skip if your AWS account already has a
    // GitHub OIDC provider (only one is allowed per account) — reuse that
    // one's ARN below instead of creating a second.
    const deployRole = isProd ? (() => {
      const oidc = new aws.iam.OpenIdConnectProvider("GithubOidc", {
        url: "https://token.actions.githubusercontent.com",
        clientIdLists: ["sts.amazonaws.com"],
        // AWS auto-manages GitHub's actual thumbprint; this value just
        // satisfies the API's required-field check.
        thumbprintLists: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
      });

      const role = new aws.iam.Role("GithubDeployRole", {
        assumeRolePolicy: $jsonStringify({
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Principal: { Federated: oidc.arn },
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringEquals: { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
              // ":*" allows any branch/tag/PR in this repo to assume the
              // role; narrow to "repo:owner/repo:ref:refs/heads/main" if
              // you only want main-branch pushes to be able to deploy.
              StringLike: { "token.actions.githubusercontent.com:sub": `repo:${githubRepo}:*` },
            },
          }],
        }),
      });

      // Broad for now so the pipeline isn't blocked on hand-picking every
      // permission SST needs (S3/CloudFront/ACM/Route53/Lambda as the
      // backend grows). Worth scoping down to just those services later.
      new aws.iam.RolePolicyAttachment("GithubDeployRolePolicy", {
        role: role.name,
        policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
      });

      return role;
    })() : undefined;

    const site = new sst.aws.StaticSite("Website", {
      path: ".",
      build: {
        command: "bash infra/build-static.sh",
        output: "dist",
      },
      // production claims the apex + www; dev gets its own subdomain in the
      // same zone. Other stages stay domain-less so ad-hoc stages don't
      // pile up DNS records or fight over the real domain.
      domain: hasDomain
        ? {
            name: isProd ? domainName : `${stage}.${domainName}`,
            redirects: isProd ? [`www.${domainName}`] : undefined,
            // production created the zone above and passes it explicitly;
            // dev looks it up by name since the zone already exists by
            // then (production must be deployed at least once first).
            dns: isProd ? sst.aws.dns({ zone: zone!.zoneId }) : sst.aws.dns(),
          }
        : undefined,
    });

    return {
      url: site.url,
      zoneNameServers: zone?.nameServers,
      githubDeployRoleArn: deployRole?.arn,
    };
  },
});

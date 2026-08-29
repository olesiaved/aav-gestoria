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
    const isProd = $app.stage === "production";

    // Created by SST rather than assumed to pre-exist. The domain itself is
    // registered elsewhere, so after the first deploy you still need to
    // copy this zone's 4 nameservers into your registrar's dashboard once
    // (see the `zoneNameServers` output) — that step lives outside AWS and
    // can't be automated from here.
    const zone = isProd ? new aws.route53.Zone("Zone", { name: domainName }) : undefined;

    const site = new sst.aws.StaticSite("Website", {
      path: ".",
      build: {
        command: "bash infra/build-static.sh",
        output: "dist",
      },
      // Only the production stage claims the real domain, so preview/dev
      // stages don't fight over it or trigger extra cert validation.
      domain: isProd
        ? {
            name: domainName,
            redirects: [`www.${domainName}`],
            dns: sst.aws.dns({ zone: zone!.zoneId }),
          }
        : undefined,
    });

    return {
      url: site.url,
      zoneNameServers: zone?.nameServers,
    };
  },
});

/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "aav-gestoria",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: [input?.stage === "production"],
      home: "aws",
    };
  },
  async run() {
    const domainName = "aavgestoria.es";
    const isProd = $app.stage === "production";

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
          }
        : undefined,
    });

    return {
      url: site.url,
    };
  },
});

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { FunctionalComponent } from "@pulumi/pulumi/runtime/component-v2";

type Args = {
  htmlContent: pulumi.Input<string>;
};

export const BucketFunctionalComponent = FunctionalComponent(
  "pkg:index:FunctionalBucket",
  async (_name, args: Args) => {
    // Automatic parenting and automatic name prefixing!

    // Can spawn resources asynchronously, and even forget to await them. Outputs must be statically
    // known though.
    console.log("In async functional component");

    const myBucket = new aws.s3.Bucket("my-bucket");

    // Works with "outputless"!
    const bucketName = await myBucket.bucket.asPromise();

    // We leak a promise here, but the component sees this and will wait for it to complete.
    new Promise(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log("Creating index.html in functional component after delay");
      new aws.s3.BucketObject(
        "index.html",
        {
          bucket: bucketName,
          source: new pulumi.asset.StringAsset(`\
  <!DOCTYPE html>
  <html>
  <body>
  ${args.htmlContent}
  </body>
  </html>
  `),
        },
        {
          parent: myBucket,
        }
      );
    });

    // const website = await myBucket.website.asPromise();
    // if (website.known() && website.value) {
    //   return {
    //     website: website.value.indexDocument,
    //   };
    // }

    return {
      bucket: myBucket,
      website: undefined,
    };
  },
);

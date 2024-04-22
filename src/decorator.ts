import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { Component } from '@pulumi/pulumi/runtime/component-v2';

@Component('pkg:index:DecoratedBucket')
export class BucketComponent  {
  bucket: aws.s3.Bucket;
  website: pulumi.Output<string | undefined>;

  constructor(_name: string, inputs: any, opts?: pulumi.ComponentResourceOptions) {
    // Automatic parenting and name prefixing!
    this.bucket = new aws.s3.Bucket('my-bucket');

    // This works even with a leaked promise:
    new Promise(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log("Creating index.html in decorated component after delay");
      new aws.s3.BucketObject(
        'index.html',
        {
          bucket: this.bucket,
          source: new pulumi.asset.StringAsset(`\
  <!DOCTYPE html>
  <html>
  <body>
  ${"test"}
  </body>
  </html>
  `),
        },
        {
          parent: this.bucket,
        },
      );
    })

    this.website = this.bucket.website.apply(x => x?.indexDocument);
  }
}

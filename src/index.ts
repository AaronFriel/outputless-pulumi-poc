import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { forkPulumiContext } from '@pulumi/pulumi/runtime/outputless';
import { outputless } from './outputless.js';

import { BucketFunctionalComponent } from './functional.js';
import { BucketComponent } from './decorator.js';

/**
 * Not strictly necessary for us to call this in a function, except for the use of decorators.
 *
 * To work with the weird old version of TypeScript and TS-Node, we need to transpile this to the
 * lowest common denominator. That means no top-level await.
 */
async function main() {
  // Spawn a new outputless context, but don't await it. This keeps the dependencies from
  // contaminating our state.
  const outputlessContext = forkPulumiContext(() => outputless());

  const fnBucket = BucketFunctionalComponent("fn-bucket", {
    htmlContent: "Hello, world!",
  });

  const decBucket = new BucketComponent('dec-bucket', {});

  // This bucket is created after everything else, but it should not depend on anything yet. Though
  // it might make sense for us to merge the outputless dependency context of the functional and
  // bucket component, we don't presently. Hmm. Worth considering.
  const bucket = new aws.s3.Bucket('post-bucket');

  // Should not depend on anything.
  const fnBucketObject = new aws.s3.BucketObject('fn-object', {
    bucket: fnBucket.bucket,
    source: new pulumi.asset.StringAsset('Hello, world!'),
  });

  // Should not depend on anything.
  const decBucketObject = new aws.s3.BucketObject('dec-object', {
    bucket: decBucket.bucket,
    source: new pulumi.asset.StringAsset('Hello, world!'),
  });

  // We could be significantly more clever with async hooks to handle flattening the state - I think
  // this .then() will now affect our current context, but theoretically it should not as it returns
  // another PromiseLike.
  const outputlessBucketObject = outputlessContext.then(({ bucket }) => {
    new aws.s3.BucketObject('outputless-object', {
      bucket,
      source: new pulumi.asset.StringAsset('Hello, world!'),
    });
  });

}

main();

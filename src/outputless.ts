import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export async function outputless() {
  const myBucket = new aws.s3.Bucket("my-bucket");
  const bucketName = await myBucket.bucket.asPromise(); // known in preview

  //    ^? ResolvedOutput<string, unknown>
  const region = await myBucket.region.asPromise(); // unknown in preview

  console.log(bucketName.value);
  // ^? unknown
  if (bucketName.known()) {
    // Type guard refines type of .value
    console.log(`👍 ${bucketName.value}`);
    //                |          ^? string
    //                ^? ResolvedOutput<string, string>
  }
  // Printing it works, whether the value or its .value prop:
  console.log(`🆒 Bucket name (known, computed): ${bucketName.value}`);
  console.log(`🆒 AWS Region (unknown): ${region.value}`);
  // ^? unknown
  // And we can JSON.stringify it, with or without .value:
  console.log(
    `✨✨✨`,
    JSON.stringify(
      {
        bucketName,
        region,
      },
      null,
      2
    )
  );
  // These all just work as expected. Applies return Output<T>
  console.log(
    "apply",
    (
      await bucketName
        .apply(
          (name) => `\
  <h1>Hello, World from ${name}!</h1>`
        )
        .asPromise()
    ).value
  );
  console.log(
    "pulumi.interpolate",
    (
      await pulumi.interpolate`\
  <h1>Hello, World from ${bucketName} in ${region}!</h1>`.asPromise()
    ).value
  );
  console.log(
    "pulumi.all",
    (await pulumi.all([bucketName, region]).asPromise()).value
  );
  // ^? Output<[string, string]>
  const obj = new aws.s3.BucketObject(
    "index.html",
    {
      bucket: bucketName, // can pass as an input
      source: pulumi.secret(
        new pulumi.asset.StringAsset(`\
  <!DOCTYPE html><html><body>${bucketName} - ${region}</body></html>`)
      ),
    },
    {
      parent: myBucket,
    }
  );

  return {
    bucket: myBucket,
    source: obj.source, // secretness preserved
  };
}

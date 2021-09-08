import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';

export class CdkEksWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new eks.Cluster(this, 'eks', {
      version: eks.KubernetesVersion.V1_21,
    });
    const adminUser = iam.User.fromUserName(this, 'adminUser', 'clarence');
    cluster.awsAuth.addUserMapping(adminUser, { groups: [ 'system:masters' ]});
  }
}

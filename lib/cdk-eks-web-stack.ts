import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';

export class CdkEksWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new eks.Cluster(this, 'eks', {
      version: eks.KubernetesVersion.V1_21,
    });
    const adminUser = iam.User.fromUserName(this, 'adminUser', 'clarence');
    cluster.awsAuth.addUserMapping(adminUser, { groups: [ 'system:masters' ]});

    cluster.addNodegroupCapacity('spot', {
      instanceTypes: [
        new ec2.InstanceType('c5.large'),
        new ec2.InstanceType('c5a.large'),
        new ec2.InstanceType('c5d.large'),
      ],
      capacityType: eks.CapacityType.SPOT,
    });
  }
}

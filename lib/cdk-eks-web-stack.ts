import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';

export class CdkEksWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new eks.Cluster(this, 'eks', {
      version: eks.KubernetesVersion.V1_21,
      defaultCapacity: 0
    });
    const adminUser = iam.User.fromUserName(this, 'adminUser', 'clarence');
    cluster.awsAuth.addUserMapping(adminUser, { groups: ['system:masters'] });

    cluster.addNodegroupCapacity('spot', {
      instanceTypes: [
        new ec2.InstanceType('c5.large'),
        new ec2.InstanceType('c5a.large'),
        new ec2.InstanceType('c5d.large'),
      ],
      capacityType: eks.CapacityType.SPOT,
    });

    const appLabel = { app: "hello-kubernetes" };
    const deployment = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { name: "hello-kubernetes" },
      spec: {
        replicas: 3,
        selector: { matchLabels: appLabel },
        template: {
          metadata: { labels: appLabel },
          spec: {
            containers: [{
              name: "hello-kubernetes",
              image: "paulbouwer/hello-kubernetes:1.5",
              ports: [{ containerPort: 8080 }],
            }],
          },
        },
      },
    };
    const service = {
      apiVersion: "v1",
      kind: "Service",
      metadata: { name: "hello-kubernetes" },
      spec: {
        type: "LoadBalancer",
        ports: [{ port: 80, targetPort: 8080 }],
        selector: appLabel
      }
    };
    cluster.addManifest("mypod", service, deployment);

    new cdk.CfnOutput(this, "LoadBalancer", {
      value: cluster.getServiceLoadBalancerAddress("hello-kubernetes"),
    });
  }
}

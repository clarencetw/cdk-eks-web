import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as fs from 'fs';
import * as YAML from 'yaml';
import * as path from 'path';

export class CdkEksWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new eks.Cluster(this, 'eks', {
      version: eks.KubernetesVersion.V1_21,
      defaultCapacity: 0
    });
    const adminUser = iam.User.fromUserName(this, 'adminUser', 'clarence');
    cluster.awsAuth.addUserMapping(adminUser, { groups: ['system:masters'] });

    cluster.addNodegroupCapacity('inf', {
      instanceTypes: [new ec2.InstanceType('inf1.xlarge')],
      capacityType: eks.CapacityType.SPOT,
      diskSize: 100,
    });
    const neuronDevicePlugin = fs.readFileSync(path.join(__dirname, '../lib', 'addons/neuron-device-plugin.yaml'), 'utf8');
    const neuronManifests = YAML.parseAllDocuments(neuronDevicePlugin);
    let i = 0
    neuronManifests.forEach((item) => {
      cluster.addManifest(`neuron-device-plugin-${i++}`, item.contents?.toJSON());
    })

    cluster.addManifest('neuron-rtd', {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'neuron-rtd' },
      spec: {
        restartPolicy: 'OnFailure',
        containers: [{
          name: 'neuron-rtd',
          image: 'clarencetw/neuron-test:master',
          securityContext: {
            capabilities: { add: ["IPC_LOCK"] }
          },
          resources: { limits: { 'aws.amazon.com/neuron': 1 } },
        }]
      }
    });
  }
}

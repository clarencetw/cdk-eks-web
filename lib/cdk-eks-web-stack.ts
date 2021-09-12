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

    cluster.addNodegroupCapacity('gpu', {
      instanceTypes: [new ec2.InstanceType('p2.xlarge')],
      capacityType: eks.CapacityType.SPOT,
      amiType: eks.NodegroupAmiType.AL2_X86_64_GPU,
      diskSize: 100,
    });
    const nvidiaDevicePlugin = fs.readFileSync(path.join(__dirname, '../lib', 'addons/nvidia-device-plugin.yml'), 'utf8');
    const nvidiaManifests = YAML.parse(nvidiaDevicePlugin);
    cluster.addManifest(`nvidia-device-plugin`, nvidiaManifests);

    cluster.addManifest('nvidia-smi', {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'nvidia-smi' },
      spec: {
        restartPolicy: 'OnFailure',
        containers: [{
          name: 'nvidia-smi',
          image: 'nvidia/cuda:11.4.1-cudnn8-devel-ubuntu20.04',
          args: ['nvidia-smi'],
          resources: { limits: { 'nvidia.com/gpu': 1 } }
        }]
      }
    });
  }
}

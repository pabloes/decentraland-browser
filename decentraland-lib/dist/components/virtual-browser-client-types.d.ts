import { Quaternion, Vector3 } from "@dcl/sdk/math";
export interface VirtualBrowserClientConfigParams {
    resolution?: Number[];
    position?: Vector3;
    scale?: Vector3;
    homeURL?: string;
    colyseusServerURL?: string;
    baseAPIURL?: string;
    rotation?: Quaternion;
    userLockTimeMs?: number;
    roomInstanceId?: any;
}

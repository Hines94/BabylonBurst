import { getViteEnvironmentVariable } from "./EnvVariableGatherer";

export enum DebugMode {
    None,
    Light,
    Heavy,
    Extreme,
}

export function GetStringAsDebugMode(string: string): DebugMode {
    for (var i = 0; i < Object.keys(DebugMode).length; i++) {
        if (DebugMode[i] === string) {
            return i;
        }
    }
    return 0;
}

/**
 * Easy interface to check if certain variables are included in env or account
 */
export class EnvVariableTracker {
    GetVariable(varName: string): string {
        //Check Vite
        const viteName = "VITE_" + varName;
        var value = undefined;
        value = getViteEnvironmentVariable(viteName);

        if (value !== undefined) {
            return value;
        } else {
            //Nothing here!
            //console.error("NO VITE VALUE");
        }
        //TODO Check account etc

        return undefined;
    }

    debugOverride: DebugMode = undefined;

    GetDebugMode(): DebugMode {
        if (this.debugOverride !== undefined) {
            return this.debugOverride;
        }
        const debug = this.GetVariable("DEBUG_MODE");
        const convert = GetStringAsDebugMode(debug);
        if (convert === undefined || convert === null || isNaN(convert)) {
            return DebugMode.None;
        }
        return convert;
    }

    GetAdminAWSCreds() {
        //TODO: What if env var for admin creds?
        var creds = {
            identityPoolId: "ap-southeast-2:a4d396b9-e557-4a8c-af6b-6e87ba912930",
            clientConfig: { region: "ap-southeast-2" },
        };
        return creds;
    }
}

export const environmentVaraibleTracker = new EnvVariableTracker();

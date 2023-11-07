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

    overrideVariables:{[id:string]:string} = {};

    GetVariable(varName: string): string {

        //Override?
        if(this.overrideVariables[varName]) {
            return this.overrideVariables[varName];
        }

        //Check Vite
        const viteName = "VITE_" + varName;
        var value = undefined;
        value = getViteEnvironmentVariable(viteName);

        if (value !== undefined) {
            return value;
        }
        //TODO Check account etc

        return undefined;
    }

    GetGameName():string {
        const potentialName=this.GetVariable("GAME_NAME");
        return potentialName ? potentialName : "SET GAME NAME";
    }

    /** Set a override variable */
    SetOverrideVariable(varName:string, value:string) {
        this.overrideVariables[varName] = value;
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

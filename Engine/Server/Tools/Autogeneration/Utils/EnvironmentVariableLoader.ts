//@ts-ignore
import * as fs from 'fs';
//@ts-ignore
import * as path from 'path';

//@ts-ignore
const envPath = path.join(__dirname, '../../../../.env');

export class EnvVarLoader {
    // The Singleton's instance property
    private static instance: EnvVarLoader;

    public environmentVariables:{[key:string]:string} = {};

    // A private property or constructor prevents instantiation
    private constructor() {
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf-8');
            const envVars = envFile.split('\n');
        
            envVars.forEach((line) => {
                const [key, value] = line.split('=');
        
                if (key && value) {
                    this.environmentVariables[key.trim()] = value.trim();
                }
            });
        } else {
            console.error('.env file not found. Looked in: ' + envPath);
            //@ts-ignore
            process.exit(1);
        }
    }

    // The static method to access the Singleton's instance
    public static getInstance(): EnvVarLoader {
        if (!EnvVarLoader.instance) {
            EnvVarLoader.instance = new EnvVarLoader();
        }
        return EnvVarLoader.instance;
    }

}
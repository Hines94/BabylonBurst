[< Home](/)

# Engine Upgrade

## bbEngineUpgrade.sh script

Engine upgrades should be easy **unless** engine code has been changed. Hopefully, only the source folders have been changed. However, it may be the case that some manual conflict resolution is needed.

## Steps
1. Commit any outstanding changes (else you will be blocked)
2. ./bbEngineUpgrade.sh
3. Manually replace any changed engine code (Note: Hopefully this step will be improved in the future)
4. Upload to source control!

## Backups
All user file data is backed up before the upgrade is attempted.It is stored in **Source_backup_$(date +'%Y%m%d_%H%M%S')**. If problems are encountered then either copy this data back in to your source folder or use git to reset.

## The process
1. The script will add a temporary branch (engine-upstream) and pull from the main engine - https://github.com/Hines94/BabylonBurst.git
2. The script will then merge back into your selected branch
3. Any user files will be copied back into your Source folder

## Copy/Paste engine
Alternatively another method is just to copy and paste in the new engine code in the "Engine" folder. This entire folder can just be placed into your project and it should work.
import Parser from "tree-sitter";

/** Find the macros and comments for an item at a level (eg a property or struct) */
export function FindMacroComment(parentNode:Parser.SyntaxNode, itemChildId:number, macroNames:string[]) {
    var bHitProperty = false;
    var macros : Parser.SyntaxNode[] = [];
    var comment : Parser.SyntaxNode | null = null;
    var backTrack = 1;
    while(!bHitProperty && backTrack < 3) {
        // Check if the previous sibling is a macro invocation
        const prevSibling = parentNode.children[itemChildId - backTrack];
        if(!prevSibling) {break;}

        var foundMacro = false;
        macroNames.forEach((macroName) => {
            if(prevSibling.text.startsWith(macroName))  {
                foundMacro = true;
                macros.push(prevSibling);
            }
        });
        if(foundMacro) {
            //Do nothing else!
        } else if (prevSibling && prevSibling.type === 'comment') {
            comment = prevSibling;
        } else {
            bHitProperty = true;
        }
        backTrack++;
    }
    return { macros: macros, comment: comment };
}

type isValidTag = (tag:string) => boolean;
export function GetMacroStringTags(macroText:string,isValidTag:isValidTag) :string[]{
    const tags:string[] = [];
    const tagRegex = /\(([^)]+)\)/;
    const inner = tagRegex.exec(macroText);
    if(inner === null){
        throw new Error("Invalid macro found in component property " + name[0].text);
    }
    inner[1].split(',').forEach((tag) => {
        var rawTag = tag.trim();
        if (isValidTag(rawTag) === false) {
            console.error(`Invalid tag for macro '${macroText}' found: '${rawTag}'.`);
            //@ts-ignore
            process.exit(1);
        }
        tags.push(rawTag);
    });
    return tags;
}
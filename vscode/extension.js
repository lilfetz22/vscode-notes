const vscode = require("vscode");
const nlp = require('compromise');
const os = require("os");
const paths = require("path");
const {
  Uri,
  Range,
  Position,
  DocumentLink,
  DocumentLinkProvider,
  commands,
  languages,
  workspace,
  window,
} = vscode;

// Define color for each part of speech
const posColors = {
  Noun: 'entity_name_type',
  Verb: 'entity_name_function',
  Adjective: 'entity_other_attribute_name',
  Adverb: 'adverb_language',
};

const tokenTypes = ['entity_name_type', 'entity_name_function', 'entity_other_attribute_name', 'adverb_language'];
const tokenModifiers = [];


exports.activate = async function activate(context) {
  context.subscriptions.push(
    commands.registerTextEditorCommand(
      "notesnlh.cycleTaskForwardNew",
      cycleTaskForwardNew
    ),
    commands.registerTextEditorCommand(
      "notesnlh.cycleTaskBackwardNew",
      cycleTaskBackwardNew
    ),
      // Add new command for NLP highlighting
  //   context.subscriptions.push(
  //     commands.registerTextEditorCommand(
  //       "notesnlh.highlightPartsOfSpeech",
  //       highlightPartsOfSpeech
  //   )
  // )
  );

  function expandPathHome(path) {
    if (path.slice(0, 1) == "~") {
      return paths.join(os.homedir(), path.slice(1, path.length));
    } else {
      return path;
    }
  }

  function regexpSubstitute(text, matches) {
    return text.replace(/\$(\d+)/g, (_, p1) => matches[parseInt(p1, 10)]);
  }

  const linkPattern = /("([^"]+?\.notesnlh)"|[^\s]+?\.notesnlh)/g;
  // A file can describe it's own links via this pattern, e.g.
  //   [/\(MLG-\d+\)/ -> https://mediciventures.atlassian.net/browse/$0]
  const externalLinkPatterns = /\[\/([^\/]+)\/\s*->\s*(https?:\/\/[^\]]+)\]/g;
  const linkProvider = {
    provideDocumentLinks: async function (document, token) {
      let relativeRoot;
      if (document.uri.scheme === "file") {
        relativeRoot = paths.dirname(document.uri.fsPath);
      } else {
        relativeRoot = null;
      }
      let text = document.getText();
      let match;
      const externalPatterns = [];

      // use global link patterns from config
      linkPatterns = vscode.workspace.getConfiguration("notesnlh")["linkPatterns"];
      if (linkPatterns) {
        for (let [regexp, link] of Object.entries(linkPatterns)) {
          externalPatterns.push({ regexp, link });
        }
      }

      // use local link patterns from this file
      while ((match = externalLinkPatterns.exec(text))) {
        externalPatterns.push({ regexp: match[1], link: match[2] });
      }
      const results = [];

      // Find "*.notesnlh" links to other notesnlh files in this document
      while ((match = linkPattern.exec(text))) {
        const linkEnd = document.positionAt(linkPattern.lastIndex);
        const linkStart = linkEnd.translate({
          characterDelta: -match[1].length,
        });
        const range = new Range(linkStart, linkEnd);
        // If inner parens match on the unquoted link text, prefer that,
        // otherwise, use the outermost match (no parens)
        const linkPath = expandPathHome(match[2] ? match[2] : match[1]);
        let linkTarget;
        if (paths.isAbsolute(linkPath)) {
          linkTarget = linkPath;
        } else if (relativeRoot) {
          linkTarget = paths.resolve(relativeRoot, linkPath);
        } else {
          // Can't add the link if it isn't absolute, and we
          // don't have a relative dir path to work with
          continue;
        }
        const fileUri = Uri.file(linkTarget);
        const docLink = new DocumentLink(range, fileUri);
        results.push(docLink);
      }

      // Find customized external links in this document
      for (pattern of externalPatterns) {
        const RE = new RegExp(pattern.regexp, "g");
        while ((match = RE.exec(text))) {
          const linkEnd = document.positionAt(RE.lastIndex);
          const linkStart = linkEnd.translate({
            characterDelta: -match[0].length,
          });
          const range = new Range(linkStart, linkEnd);
          const uri = Uri.parse(regexpSubstitute(pattern.link, match));
          const docLink = new DocumentLink(range, uri);
          results.push(docLink);
        }
      }
      return results;
    },
  };

  context.subscriptions.push(
    languages.registerDocumentLinkProvider({ scheme: 'file', language: "notesnlh" }, linkProvider)
  );

  function swap(obj) {
    let ret = {};
    for (let key in obj) {
      ret[obj[key]] = key;
    }
    return ret;
  }

  const nextStateLookup = {
    "[ ]": "[√]",
    "[√]": "[!]",
    "[!]": "[x]",
    "[x]": "[ ]",
  };

  function nextTaskState(currentState) {
    const lookup = nextStateLookup[currentState];
    if (lookup) {
      return lookup;
    } else {
      return currentState;
    }
  }

  function prevTaskState(currentState) {
    const lookup = swap(nextStateLookup)[currentState];
    if (lookup) {
      return lookup;
    } else {
      return currentState;
    }
  }

  function cycleTaskForwardNew(editor) {
    cycleTask(editor, nextTaskState);
  }

  function cycleTaskBackwardNew(editor) {
    cycleTask(editor, prevTaskState);
  }

  function cycleTask(editor, nextStateFn) {
    editor.edit((editBuilder) => {
      editor.selections.forEach((selection) => {
        let lineNo = selection.start.line;
        while (lineNo <= selection.end.line) {
          const line = editor.document.lineAt(lineNo);
          const m = line.text.match(/^\s*(\[.?\])/);
          if (m) {
            const braceMatch = m[1];
            const position = line.text.indexOf(braceMatch);
            const range = new Range(
              new Position(lineNo, position),
              new Position(lineNo, position + 3)
            );
            const newText = nextStateFn(braceMatch);
            editBuilder.replace(range, newText);
          } else {
            let insertPos = selection.active.character;
            const m2 = line.text.match(/[^\s]/);
            if (m2) {
              insertPos = line.text.indexOf(m2[0]);
            }
            editBuilder.insert(new Position(lineNo, insertPos), "[ ] ");
          }
          lineNo++;
        }
      });
    });
  }

  // Define the semantic tokens provider
  const semanticTokensProvider = {
    provideDocumentSemanticTokens(document) {
      const text = document.getText();
  
      try {
        const doc = nlp(text);
        const json = doc.json();
        const builder = new vscode.SemanticTokensBuilder(legend);
        let lineNumber = 0;
        let characterNumber = 0;

        for (const sentence of json) {
          for (const term of sentence.terms) {
            if (!term || typeof term !== 'object') {
              console.log('Invalid term:', term, 'type of term:', typeof term);
              continue;
            }

            var pos = term.tags[0];
            if (pos.toLowerCase().includes('noun')) {
              // console.log('Noun detected:', pos);
              pos = 'Noun';
            }
            if (posColors[pos]) {
              const range = new vscode.Range(
                new vscode.Position(lineNumber, characterNumber),
                new vscode.Position(lineNumber, characterNumber + term.text.length)
              );
              // console.log(`Pushing token: ${term.text}, Type: ${posColors[pos]}, 
              //   Range: ${range.start.line + 1}:${range.start.character + 1}-${range.end.line + 1}:${range.end.character + 1}`);
              builder.push(range, posColors[pos]);
            }

            // Handle the term text, including any embedded punctuation
            for (const char of term.text) {
              if (char === '\n') {
                lineNumber++;
                characterNumber = 0;
              } else {
                characterNumber++;
              }
            }

            // Handle punctuation and spaces after the term
            const afterText = term.post;
            for (const char of afterText) {
              if (char === '\n') {
                lineNumber++;
                characterNumber = 0;
              } else {
                characterNumber++;
              }
            }
          }
        }
        const tokens = builder.build();
        // console.log('Built tokens:', tokens);
        return tokens
      } catch (error) {
        console.error('Error in provideDocumentSemanticTokens:', error);
        return null;
      }
    }  
  };
  // Register the semantic tokens provider
  const selector = { language: 'notesnlh', scheme: 'file' };
  const legend = new vscode.SemanticTokensLegend(tokenTypes);
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      selector,
      semanticTokensProvider,
      legend
    )
  );
};

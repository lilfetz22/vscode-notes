# Notes with Natural Language Highlighting (NLH)

## Features

Syntax highlighting for notes with **Natural Language Highlighting** that automatically colorizes text based on parts of speech (nouns, verbs, adjectives, adverbs, and numbers). Also includes simple TODO lists and cross-linking (cmd/ctrl-click) between notes.

### Natural Language Highlighting

This extension uses natural language processing (NLP) to analyze your text and apply different colors to different parts of speech:

- **Nouns** - Highlighted in one color (entities/types)
- **Verbs** - Highlighted in another color (actions/functions)
- **Adjectives** - Highlighted distinctly (descriptive words)
- **Adverbs** - Highlighted separately (modifiers)
- **Numbers** - Highlighted as values

This makes it easier to visually parse your notes and understand the structure of your writing at a glance.

<img src="https://github.com/lilfetz22/vscode-notes/blob/master/images/Natural_Language_Highlighting.png?raw=true" width="544">

The example above shows natural language highlighting in action. Open `examples/natural_language_highlighting.notesnlh` to see this feature yourself.

## Installation

1. Clone or download this repository
2. Open the folder in VS Code
3. Install dependencies: `npm install`
4. Press `F5` to run the extension in development mode
5. Create or open a `.notesnlh` file to see natural language highlighting in action

## Snippets & Commands

A `newday` snippet includes the current date and a set of organizing section headings:

```
[2019-02-02]
Notes:
Ideas:
TODO:
Activity Log:
```

To add a new "TODO" item checkbox, use the `cmd/ctrl+L` shortcut:

```
[ ] Pick up daughter after school
[√] Install VS Code `notes` extension
```

When the cursor is on a line with a TODO checkbox, subsequent `cmd/ctrl+L` directives will cycle through `[√]` (done) and `[x]` (won't do).

## Cross-linking Notes

If you mention another `*.notesnlh` file, it will be underlined and become a hyperlink: `work.notesnlh`. To follow the link, use the vscode `cmd/ctrl+click` standard feature. References to notes can be absolute or relative; if relative, they are relative to the current document.

If the notes file you'd like to link to contains spaces, you can use "double quotes" to indicate the spaces should be included in the hyperlink. You can also use tilde (`~`) to mean your home directory, e.g. `~Notes/journal.notesnlh`.


## Configurable Links

If you use shortened patterns in your notes files to refer to web pages (for example, an issue tracker has short IDs) then you can use a regular expression to teach your `notes` file what to do with it when clicked:

For example, to create links to tickets on Atlassian with prefix "ABC-", you could do something like this:
```
[/ABC-\d+/ -> https://abc-project.atlassian.net/browse/$0]
```

Now, the following pattern will be recognized as a clickable link in your note file:
```
(ABC-1234)
```
... and clicking it will send you to `https://abc-project.atlassian.net/browse/ABC-1234`

You can also add global link patterns to your config via the `notesnlh.linkPatterns` config key.

## File Extensions

This extension supports `.notesnlh` files for notes with natural language highlighting enabled.

## How Natural Language Highlighting Works

This extension uses the [Compromise NLP library](https://github.com/spencermountain/compromise) to analyze your text in real-time. As you type, it identifies parts of speech and applies semantic token highlighting:

- The extension processes each sentence and term
- Words are categorized by their grammatical function
- Special blocks (code snippets, comments, TODO items) are excluded from NLP analysis
- Colors are applied based on customizable semantic token types
- Highlighting updates automatically as you edit

The NLP analysis runs efficiently in the background, providing instant visual feedback as you write your notes.

## Configuration

### Natural Language Highlighting Settings

You can customize which parts of speech are highlighted in your settings:

```json
{
  "notesnlh.highlightNouns": true,
  "notesnlh.highlightVerbs": true,
  "notesnlh.highlightAdjectives": true,
  "notesnlh.highlightAdverbs": true,
  "notesnlh.highlightNumbers": true
}
```

Set any of these to `false` to disable highlighting for that part of speech.

### Custom Colors

You may want to configure some of the text colors. In your vscode settings file, you can customize the semantic token colors:

```json
"editor.semanticTokenColorCustomizations": {
    "rules": {
        "entity_name_type": "#4EC9B0",
        "entity_name_function": "#DCDCAA",
        "entity_other_attribute_name": "#9CDCFE",
        "adverb_language": "#C586C0",
        "value_type": "#B5CEA8"
    }
}
```

You can also configure traditional TextMate scopes:

```
"editor.tokenColorCustomizations": {
    "textMateRules": [
        {
            "scope": "keyword.operator.notes",
            "settings": {
                "foreground": "#92b630"
            }
        },
        {
            "scope": "variable.language.notes",
            "settings": {
                "foreground": "#92b630",
                "fontStyle": "italic"
            }
        }
    ]
}
```

All of the traditional TextMate scopes you can configure are as follows:

```
source.notesnlh
markup.heading.notesnlh
markup.changed.notesnlh
markup.canceled.notesnlh
markup.bold.notesnlh
variable.language.notesnlh
keyword.other.notesnlh
keyword.operator.notesnlh
invalid.deprecated.notesnlh
comment.notesnlh
string.quoted.single.notesnlh
string.quoted.double.notesnlh
string.regexp
entity.name.tag.notesnlh
```

Other scopes are language-specific. See `syntaxes/custom-colors.json` if you would like to override your theme and use custom colors.

## Supported Syntax Highlighting

When adding code snippets, you can use the following language indicators after a [language-tag] (square brackets necessary) to get syntax highlighting for that language:

```
actionscript|as -> source.actionscript.2
applescript -> source.applescript
asp|asa -> source.asp
c -> source.c
cs|c#|csharp -> source.cs
c++|cpp|cc|cxx -> source.c++
clj|clojure -> source.clojure
css -> source.css
di -> source.d
erl|hrl|Emakefile|emakefile| -> source.erlang
go|golang -> source.go
groovy|gvy -> source.groovy
hs|haskell -> source.haskell
html|htm|shtml|xhtml|phtml|inc|tmpl|tpl|ctp -> text.html.basic
java|bsh -> source.java
js|jsx|htc|javascript -> source.js
lua -> source.lua
gnumakefile|makefile|makefile|ocamlmakefile|make -> source.makefile
mdown|markdown|markdn|md -> text.html.markdown
matlab -> source.matlab
objective-c|objc|m|h -> source.objc
ocaml|ml|mli -> source.ocaml
p|pas|pascal -> source.pascal
pm|pl|pod|t|perl -> source.perl
php -> source.php
cpy|py|python|rpy|pyw -> source.python
r|s|rprofile -> source.r
re|regex|regexp -> source.regexp
rb|rbx|rjs|ruby|Rakefile|rake|cgi|fcgi|gemspec|irbrc|capfile|gemfile -> source.ruby
scala -> source.scala
sh|bash|zsh|bashrc -> source.shell
sql|dml|ddl|mysql -> source.sql
tcl -> source.tcl
tex|latex|sty|cls -> text.tex
xml|tld|jsp|pt|cpt|dtml|rss|opml -> text.xml
yaml|yml -> source.yaml
```

## Release Notes

See [CHANGELOG.md](CHANGELOG.md).

Syntax highlighting based on [Sublime Text Notes](https://packagecontrol.io/packages/Notes) by tbh1.

## Acknowledgements

This version of vscode-notes is a fork and enhancement of the original work by Duane Johnson ([canadaduane](https://github.com/canadaduane)). The Natural Language Highlighting feature has been added to enhance the note-taking experience by providing visual differentiation of parts of speech using NLP technology. We're grateful for the solid foundation provided by the original project.

Syntax highlighting based on [Sublime Text Notes](https://packagecontrol.io/packages/Notes) by tbh1.

Natural Language Processing powered by [Compromise](https://github.com/spencermountain/compromise).

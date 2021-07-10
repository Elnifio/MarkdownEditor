let Parser = require("../MarkdownCompiler/parser");
let Components = require("../MarkdownCompiler/Components");
let Diff = require("../MarkdownCompiler/ASTDiffer");
let AST = require("../MarkdownCompiler/AST");
let ASTZipper = require("../MarkdownCompiler/ASTZipper");
let Disp = require("../MarkdownCompiler/ASTDisplay");

let pobj = new Parser.Parser();
let differ = new Diff.Differ();
let zipper = new ASTZipper.ASTZipper();
let disp = new Disp.Displayer();

let Editor = function(taglist) {
    this.state = {
        currval: "", 
        tags: [],
        alltags: taglist,
    };

    this.setCurrent = function(newval) {
        this.state.currval = newval;
    };

    this.getCurrent = function() { return this.state.currval; };
    this.tags = function() {
        return this.state.tags;
    }

    this.setTag = function(newtags) {
        this.state.tags = newtags;
    }

    this.alltags = function() {
        return this.state.alltags;
    }
}
exports.Editor = Editor;

/**
 * 
 * @param {AST.MD} ast root Markdown Block container
 */
let TODOCollector = function(ast) {
    if (ast) return ast.blocks.filter(x => x.type == AST.ASTTypes.TODO).map(x => zipper.zip(x));
}
exports.TODOCollector = TODOCollector;

Vue.component("editor", {
    props: {
        "estore": Editor,
        "value": String,
        "editable": Boolean,
    },

    methods: {
        updator: function(event) {
            this.$emit("value-update", event.target.value);
        },
        inputUpdate: function(event) {
            this.$emit("input-update", event);
        },
        select: function(event) {
            console.log(event);
        },
    },
    template: `
    <v-textarea 
        @blur="updator($event)" 
        @select="select($event)" 
        :value="value" 
        @input="inputUpdate($event)" 
        auto-grow
        :disabled="!editable"
        overflow="auto">
    </v-textarea>
    `
});

let newAST, taglist, idx;
Vue.component("editor-control", {
    props: ['estore', 'editable'],
    data: function() {
        return {
            editorstore: this.estore,
            ast: pobj.parse(this.estore.getCurrent()),
            selector: {
                start: 0, end: 0
            },
            tabchooser: false,
            newtab: "",
        }
    },
    watch: {
        "editorstore.state.currval": function(newval, oldval) {
            newAST = pobj.parse(newval);
            differ.diff(newAST, this.ast);
            this.ast = newAST;
        },
    },
    methods: { 
        log: function(e) {
            console.log(e);
        },
        addTag: function(tag) {
            console.log("EditorModule.addTag(): Adding tag: " + tag.name);
            this.$emit("add-tag", tag);
            taglist = this.editorstore.tags();
            if (taglist.indexOf(tag) < 0) taglist.push(tag);
        },
        deleteTag: function(tag) {
            this.$emit("delete-tag", tag);
        },
        store: function(event) {
            this.$emit("store-to-system", TODOCollector(this.ast));
        },
        update: function(event) {
            this.editorstore.setCurrent(event);
        },
        select: function(event) {
            console.log(event);
        },
        change: function(newobject) {
            let oldvalue = this.editorstore.getCurrent();
            this.editorstore.setCurrent(oldvalue.substring(0, newobject.index.start) + newobject.newcontent + oldvalue.substring(newobject.index.end));
            newAST = pobj.parse(this.editorstore.state.currval);
            this.$emit("store-to-system", TODOCollector(newAST));
        }
    },
    template: `
    <v-row>
        <v-col cols=6>
            <v-card height="95vh" style="overflow:auto" flat tile>
                <editor 
                    v-model="editorstore.getCurrent()" 
                    @value-update="store($event)" 
                    @input-update="update($event)"
                    :editable="editable" height="100vh"></editor>
            </v-card>
        </v-col>
        <v-divider vertical></v-divider>
        <v-col cols=6>
            <v-card height="95vh" style="overflow:auto" flat tile>
                <v-chip-group>
                    <tab-chip 
                        v-for="tab in editorstore.state.tags" 
                        :tab="tab"
                        :tabDelete="true"
                        @tab-delete="deleteTag"></tab-chip>

                    <v-menu v-model="tabchooser" offset-x>
                        <template v-slot:activator="{ on, attrs }">
                            <v-chip class="ma-1" label @click="tabchooser=!tabchooser" outlined>
                                <v-icon>
                                    mdi-plus
                                </v-icon>
                            </v-chip>
                        </template>

                        <v-card max-height="30vh" max-width="300px">
                            <tab-chip 
                                v-for="tag in editorstore.alltags()" 
                                :tab="tag" 
                                :tabDelete="false"
                                @tab-click="addTag">
                            </tab-chip>
                        </v-card>
                    </v-menu>
                </v-chip-group>

                <markdown-block :ast="ast" v-if="ast" @change="change"></markdown-block>
            </v-card>
        </v-col>
    </v-row>
    `
})
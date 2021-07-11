let unzipper = require("../MarkdownCompiler/ASTZipper").ASTUnzipper;
let disp = require("../MarkdownCompiler/ASTDisplay");
let disper = new disp.Displayer();
let Parser = require("../MarkdownCompiler/parser");
let pobj = new Parser.Parser();
let TODOCollector = require("../Editor/EditorModule").TODOCollector;

let collectTabs = function(listnodes) {
    return [];
}

let newtodo;
Vue.component("todo-item", {
    props: ['fileNode'],
    data: function() {
        return {
            node: this.fileNode,
            asts: this.fileNode.todos.map(x => unzipper(x)),
        };
    },
    methods: {
        updateAtIndex: function(newobject, block) {
            this.node.updateAtIndex(newobject.index, newobject.newcontent);
            newtodo = TODOCollector(pobj.parse(this.node.content));
            this.fileNode.todos = newtodo;
            this.asts = this.fileNode.todos.map(x => unzipper(x));
            this.$emit("update-editor-content");
        },
    },
    template: `
    <v-card max-width="25vw" min-width="200px" max-height="99%" style="flex-direction:column;display:flex;" color="grey lighten-4">
        <v-card-title style="flex:0 0 auto" :class="node.tabs.length!=0?'mb-0 pb-0':''">
            {{ node.getCanonicalName() }}
        </v-card-title>

        <v-chip-group v-if="node.tabs.length!=0" style="flex:0 0 auto" class="mx-1">
            <tab-chip
                v-for="tab in node.tabs"
                :tab="tab"
                :tabDelete="false">
            </tab-chip>
        </v-chip-group>

        <v-divider></v-divider>

        <v-sheet :elevation="0" style="overflow:auto;flex:1 1 auto" class="mx-2" color="grey lighten-4">
            <v-hover v-slot="{ hover }" v-for="block in asts">
                <v-card class="ma-2 pa-2" :class="hover?'grey lighten-5':''">
                    <component 
                        :is="block.type" 
                        :content="block" 
                        @change="updateAtIndex($event, block)">
                    </component>
                </v-card>
            </v-hover>
        </v-sheet>

        <v-divider></v-divider>

        <v-card-text class="d-flex" style="flex:0 0 auto">
            <span class="mr-auto">{{ node.path }}</span>
            <v-icon class="float-right">mdi-file-edit-outline</v-icon>
        </v-card-text>
    </v-card>
    `
})

Vue.component("todo-lists", {
    props: ['todonodes'],
    methods: {
        propagateUpdateEditor: function() {
            this.$emit("update-editor-content")
        }
    },
    template: `
    <v-slide-group style="height:100%" class="py-2">
        <v-slide-item v-for="node in todonodes" style="height:inherit">
            <v-sheet height="inherit">
                <todo-item :fileNode="node" :key="node.path" class="mx-2" @update-editor-content="propagateUpdateEditor">
                </todo-item>
            </v-sheet>
        </v-slide-item>
    </v-slide-group>
    `
})

Vue.component("todo-page", {
    props: ["nodes"],
    data: function() {
        return {
            todonodes: this.nodes,
            tablists: [
                {title: "All TODOs", 
                icon: "mdi-checkbox-marked-outline", 
                mask: (x) => { return true; }}
            ]
        }
    },
    template: `
        <v-sheet max-height="95vh">
            <v-tabs icons-and-text>
                <v-tab v-for="tab in tablists" :key="tab.title">
                    <v-icon>
                        {{ tab.icon }}
                    </v-icon>
                    {{ tab.title }}
                </v-tab>
            </v-tabs>
        </v-sheet>
    `
})
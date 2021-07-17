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
        openFile: function() {
            this.$emit("editor-switch-to-file", this.node);
        }
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
                :tabDelete="false"
                :activated="true">
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

        <v-card-text class="d-flex py-1" style="flex:0 0 auto">
            <span class="mr-auto">{{ node.path }}</span>
            <v-icon class="float-right" @click.prevent.stop="openFile">mdi-file-edit-outline</v-icon>
        </v-card-text>
    </v-card>
    `
})

Vue.component("todoitem", {
    props: ["node", "color"],
    data: function() {
        return {
            asts: this.node.todos.map(x => unzipper(x)),
            opened: Math.abs(this.node.reportTODOProgress() - 100) > 0.001,
        }
    },
    methods: {
        updateAtIndex: function(newobject, block) {
            this.node.updateAtIndex(newobject.index, newobject.newcontent);
            newtodo = TODOCollector(pobj.parse(this.node.content));
            this.node.todos = newtodo;
            this.asts = this.node.todos.map(x => unzipper(x));
            this.$emit("update-editor-content");
        },
        openFile: function() {
            this.$emit("editor-switch-to-file", this.node);
        }
    },
    template: `
    <v-card class="ma-2 pa-2">
        <v-sheet class="d-flex" @click.prevent.stop="opened = !opened">
            <v-icon @click.prevent.stop="openFile" class="mx-2 my-auto">mdi-file-edit-outline</v-icon>
            <span class="text-h4 mr-auto my-auto">{{node.getCanonicalName()}}</span>
            <v-chip-group v-if="node.tabs.length!=0" style="max-width:25%" class="mx-1">
                <tab-chip
                    v-for="tab in node.tabs"
                    :tab="tab"
                    :tabDelete="false"
                    :activated="true">
                </tab-chip>
            </v-chip-group>
            <span class="text-body-2 my-auto">{{ node.path }}</span>
            <template v-if="!opened">
                <v-divider vertical class="mx-2"></v-divider>
                <span class="text-body-1 my-auto">{{ node.reportTODOCount() }}</span>
            </template>
            <v-icon>{{opened?'mdi-chevron-down':'mdi-chevron-right'}}</v-icon>
        </v-sheet>
        <v-progress-linear :color="color" height="2" :value="node.reportTODOProgress()"></v-progress-linear>
        <v-sheet v-if="opened">
            <component 
                v-for="block in asts" 
                :is="block.type" 
                :content="block" 
                @change="updateAtIndex($event, block)">
            </component>
        </v-sheet>
    </v-card>
    `
})

let idx;
Vue.component("todo-lists", {
    props: ['todonodes'],
    data: function() {
        return {
            mask: []
        }
    },
    computed: {
        tabs: function() {
            return Array.from(new Set(this.todonodes.map(x => x.tabs).flat()));
        }, 
    },
    methods: {
        propagateUpdateEditor: function() {
            this.$emit("update-editor-content")
        },
        tabClickHandler: function(tab) {
            idx = this.mask.indexOf(tab)
            if (idx < 0) {
                this.mask.push(tab);
            } else {
                this.mask.splice(idx, 1);
            }
        },
        containLabel: function(node) {
            // either this node contains all mask, or the mask length is 0
            return (this.mask.map(
                    x => node.tabs.indexOf(x) >= 0
                ).reduce(
                    (accu, curr) => accu && curr, 
                true)) || this.mask.length==0;
        },
        propagateSwitch: function(node){
            this.$emit("editor-switch-to-file", node);
        }
    },
    template: `
    <v-sheet style="height:100%;flex-direction:column;display:flex">
        <v-sheet class="mx-1 d-flex" style="flex:0 0 auto">
            <div class="py-2 pr-1">
                <template v-if="tabs.length!=0"><v-icon class="px-1">mdi-filter-outline</v-icon>Tag Filter:</template>
                <template v-else><v-icon class="px-1">mdi-filter-remove-outline</v-icon>No Tag Filters Available.</template>
            </div>
            <v-chip-group style="border-bottom:1px solid grey">
                <tab-chip
                    v-for="tab in tabs"
                    :tab="tab"
                    :tabDelete="false"
                    :activated="mask.indexOf(tab)<0"
                    @tab-click="tabClickHandler">
                </tab-chip>
            </v-chip-group>
        </v-sheet>
        <v-slide-group class="py-2" style="flex:1 1 auto;overflow:auto">
            <v-slide-item v-for="node in todonodes" style="height:inherit" v-if="containLabel(node)">
                <v-sheet height="inherit">
                    <todo-item 
                        :fileNode="node" 
                        :key="node.path" 
                        class="mx-2" 
                        @update-editor-content="propagateUpdateEditor"
                        @editor-switch-to-file="propagateSwitch">
                    </todo-item>
                </v-sheet>
            </v-slide-item>

            <v-slide-item v-if="todonodes.length == 0 || true" style="height:inherit">
                <v-card 
                    max-width="25vw" 
                    min-width="200px" 
                    max-height="99%" 
                    height="auto"
                    style="flex-direction:column;display:flex;" 
                    color="grey lighten-4">
                    <v-card-title 
                        style="flex:0 0 auto" 
                        class="mb-0 pb-0">
                        All Items Completed
                    </v-card-title>

                    <v-divider></v-divider>

                    <v-sheet 
                        :elevation="0" 
                        style="overflow:auto;flex:1 1 auto" 
                        class="mx-2" 
                        color="grey lighten-4">
                        <v-hover v-slot="{ hover }" v-for="n in 3">
                            <v-card class="ma-2 pa-2" :class="hover?'grey lighten-5':''">
                                <v-skeleton-loader type="list-item-avatar-two-line" boilerplate>
                                </v-skeleton-loader>
                            </v-card>
                        </v-hover>
                    </v-sheet>
                </v-card>
            </v-slide-item>
        </v-slide-group>
    </v-sheet>
    `
})

Vue.component("todolists", {
    props: ['todonodes', 'mask'],
    computed: {
        requestedNodes: function() {
            return this.todonodes.filter(x => this.containLabel(x));
        },
        allProgress: function() {
            if (this.requestedNodes.length == 0) {
                return 100;
            } else {
                return this.requestedNodes.reduce((accumulator, currentvalue) => accumulator + currentvalue.reportTODOProgress(), 0) / this.requestedNodes.length;
            }
        },
        allCounts: function() {
            return this.requestedNodes.reduce((accu, currval) => accu + currval.reportTODOCount(), 0);
        },
        streamColor: function() {
            if (this.mask) {
                return this.mask.color;
            } else {
                return "#62C6F2FF";
            }
        }
    },
    methods: {
        log(e) {
            console.log(e);
        },
        propagateUpdateEditor: function() {
            this.$emit("update-editor-content")
        },
        tabClickHandler: function(tab) {
            if (this.mask == tab) {
                this.mask = undefined;
            } else {
                this.mask = tab;
            }
        },
        containLabel: function(node) {
            // either this node contains all mask, or the mask length is 0
            return (!this.mask) || node.tabs.indexOf(this.mask) >= 0;
        },
        propagateSwitch: function(node){
            this.$emit("editor-switch-to-file", node);
        }
    },
    template: `
    <v-sheet style="height:100%" class="mx-2">
        <v-sheet class="d-flex ma-2">
        <h2 
            class="text-h4 mr-auto" 
            style="font-family:'Courier New'!important;font-weight:bold" 
            :style="{color:mask?mask.color:'black'}">
            {{ mask?mask.name:'All TODOs' }}
        </h2>

        <v-hover v-slot="{ hover }">
            <v-slide-x-transition>
                <v-progress-circular 
                    :value="allProgress" 
                    :color="mask?mask.color:'black'"
                    v-if="hover"></v-progress-circular>
                <h2
                    class="text-h4 unselectable"
                    style="font-family:'Courier New'!important;font-weight:bold"
                    :style="{color:mask?mask.color:'black'}"
                    v-else>
                    {{ allCounts }}
                </h2>
            </v-slide-x-transition>
        </v-hover>
        
        </v-sheet>

        <template>
        </template>
        <v-sheet v-for="node in requestedNodes" :key="node.path" @click.prevent.stop="log(node.reportTODOCount())">
            <todoitem 
                :node="node" 
                :color="streamColor"
                @update-editor-content="propagateUpdateEditor" 
                @editor-switch-to-file="propagateSwitch">
            </todoitem>
        </v-sheet>
    </v-sheet>
    `
})
let Icons = [
    'mdi-tag',
    "mdi-leaf",
    "mdi-rocket",
    "mdi-robot-mower",
    "mdi-robot-vacuum",
    "mdi-water",
    "mdi-eye-circle",
    "mdi-calculator",
    "mdi-calendar-blank",
    "mdi-call-merge",
    "mdi-face-woman",
    "mdi-face-profile",
    "mdi-fan",
    "mdi-camera",
    "mdi-lightning-bolt",
    "mdi-link",
    "mdi-lightbulb-on-outline",
    "mdi-feather",
    "mdi-safe",
    "mdi-link-box-variant",
    "mdi-linux",
    "mdi-lock",
    "mdi-saw-blade",
]

class TabInstanceError {
    constructor(msg) {
        this.msg = msg;
        this.name = "TabInstance Error";
    }

    toString() {
        return this.name + ": " + this.msg;
    }
}

class TabInstance {
    constructor(name, children=[], icon="mdi-tag", color="#62C6F2FF", opened=false) {
        this.name = name;
        this.children= children;
        this.icon = icon;
        this.color = color;
        this.opened = opened;
    }

    addChild(child) {
        if (this.children.indexOf(child) < 0) {
            this.children.push(child);
            child.addTab(this);
        }
    }

    deleteChild(child) {
        let idx = this.children.indexOf(child);
        if (idx < 0) {
            throw new TabInstanceError(`TabInstance.deleteChild(): Cannot find child ${child.getCanonicalName()}`);
        } else {
            this.children.splice(idx, 1);
            child.deleteTab(this);
        }
    }

    selfDelete() {
        this.children.forEach(x => this.deleteChild(x));
    }

    toggleOpen() {
        this.opened = !this.opened;
    }

    zip() {
        return [this.name, this.icon, this.color, this.opened];
    }
}
exports.TabInstance = TabInstance;

Vue.component("tab-chip", {
    props: ["tab", "tabDelete"],
    template: `
    <v-chip
        class="ma-1"
        small
        :color="tab.color"
        outlined
        @click="$emit('tab-click', tab)"
        :close="tabDelete"
        @click:close="$emit('tab-delete', tab)">
        <v-icon left>
            {{ tab.icon }}
        </v-icon>
        {{ tab.name }}
    </v-chip>
    `,
})

Vue.component("tab-list-item", {
    props: ["givenTab"],
    data: function() {
        return {
            tab: this.givenTab,
            menu: false,
        }
    },
    methods: {
        log: function(x) {
            console.log(x);
            this.$emit("change-name", this.tab);
        },
        propagateDeleteTab: function(x) {
            this.$emit("delete-tab", x);
        },
        propagateRelocation: function(node, newpath) {
            this.$emit("relocate-node", node, newpath);
        },
        propagateDeletion: function(node) {
            this.$emit("delete-node", node);
        },
        propagateClick: function(node) {
            this.$emit("click-node", node);
        }
    },
    template: `
    <v-sheet elevation="0" class="pl-2">

        <v-menu
            v-model="menu"
            :close-on-content-click="false"
            offset-x
            @input="log">
            <template v-slot:activator="{ on, attrs }">
                <v-hover v-slot="{ hover }">
                    <v-sheet 
                        elevation="0" 
                        @click.prevent.stop="tab.toggleOpen()"
                        class="d-flex ma-1 pa-1"
                        :class="hover?'grey lighten-4':''"
                        @contextmenu="menu=!menu">

                        <v-icon class="mr-2" :color="tab.color">{{ tab.icon }}</v-icon>
                        <span class="unselectable mr-auto">{{ tab.name }}</span>
                        <v-icon>mdi-chevron-{{ tab.opened?"down":"left" }}</v-icon>
                    </v-sheet>
                </v-hover>
            </template>

            <tab-editor :givenTab="tab" @delete-tab="propagateDeleteTab"></tab-editor>
        </v-menu>

        <v-sheet elevation="0" v-if="tab.opened" class="pl-2">
            <fs-node v-for="child in tab.children"
                :fsnode="child"
                :key="child.path"
                @relocate-node="propagateRelocation"
                @delete-node="propagateDeletion"
                @click-node="propagateClick">
            </fs-node>
        </v-sheet>
    </v-sheet>
    `
})

Vue.component("tab-editor", {
    props: {'givenTab': TabInstance, },
    data: function() {
        return {
            tab: this.givenTab,
            icons: Icons,
            confirm: false,
        }
    },
    methods: {
        log: function(x) {
            console.log(x);
        },
        handleDelete: function() {
            if (!this.confirm) {
                this.confirm = true;
            } else {
                this.$emit("delete-tab", this.tab);
            }
        },
        revertDelete: function() {
            this.confirm = false;
        }
    },
    template: `
    <v-card max-width="300px">
        <v-card-title> 
            <v-text-field
                dense
                label="Tag Name"
                @change="log"
                v-model="tab.name"
                ref="newname"
                :rules="[ () => !!tab.name || 'Required.', ]"
                :hint="'New Name: ' + tab.name">

                <template v-slot:append>
                    <v-icon :color="tab.color"> {{tab.icon}} </v-icon>
                </template>

                <template v-slot:append-outer>
                    <v-icon
                        :color="confirm?'error':'warning'"
                        @click.prevent.stop="handleDelete"
                        @blur="revertDelete">
                        {{ confirm?'mdi-trash-can':'mdi-trash-can-outline' }}
                    </v-icon>
                </template>
            </v-text-field>
        </v-card-title> 

        <v-color-picker
            dot-size="25"
            hide-canvas
            hide-mode-switch
            mode="rgba"
            swatches-max-height="200"
            v-model="tab.color">
        </v-color-picker>

        <v-sheet max-height="10vh" min-height="100px" style="overflow:auto" class="mx-auto">
            <icon-picker 
                :chosen="tab.icon" 
                :color="tab.color" 
                @chosen-icon="tab.icon=$event">
            </icon-picker>
        </v-sheet>
    </v-card>
    `
})

{/* <v-icon 
                v-for="icon in icons" 
                class="ma-2" 
                :color="icon==tab.icon?tab.color:''"
                @click.prevent.stop="tab.icon=icon">{{icon}}</v-icon> */}
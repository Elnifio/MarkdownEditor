let Icons = [
    ['mdi-tag', "mdi-file", "mdi-calendar"],
    ['mdi-leaf', 'mdi-rocket', 'mdi-robot-mower', "mdi-robot-vacuum", 'mdi-laptop'],
    ["mdi-language-html5", "mdi-language-c", "mdi-language-cpp", "mdi-language-go", "mdi-language-java", "mdi-language-javascript", "mdi-language-markdown-outline", "mdi-language-python", "mdi-language-r", 'mdi-language-swift'],
    ["mdi-emoticon", "mdi-emoticon-angry", "mdi-emoticon-confused"]
];

Vue.component("icon-picker", {
    props: ["chosen", "color"],
    data: function() {
        return {
            icons: Icons
        }
    },
    methods: {
        updateChosen: function(x) {
            this.$emit("chosen-icon", x);
        }
    },
    template: `
    <v-sheet elevation="0">
        <v-sheet elevation="0" v-for="group in icons" class="my-2">
            <v-icon
                v-for="icon in group"
                class="ma-1"
                :color="icon==chosen?color:''"
                @click.prevent.stop="updateChosen(icon)">
                {{ icon }}
            </v-icon>
        </v-sheet>
    </v-sheet>
    `
})
let TabInstance = function(name, children=[], icon="mdi-tag", color="blue") {
    this.name = name;
    this.children= children;
    this.icon = icon;
    this.color = color;

    this.addChild = function(child) {
        this.children.push(child);
        
    }
}
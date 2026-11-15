let activeImports = 0;

const beginImport = () => {
    activeImports += 1;
};

const endImport = () => {
    activeImports = Math.max(0, activeImports - 1);
};

const hasActiveImport = () => activeImports > 0;

module.exports = {
    beginImport,
    endImport,
    hasActiveImport
};

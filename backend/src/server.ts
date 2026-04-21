// import "module-alias/register";
// import app from "./app";

// app.listen(5000);

import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
    console.log(`[ENV] ${process.env.NODE_ENV}`);
});
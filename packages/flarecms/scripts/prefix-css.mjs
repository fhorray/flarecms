import fs from 'node:fs';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import prefixer from 'postcss-prefix-selector';

async function build() {
  const input = './src/client/index.css';
  const output = './dist/style.css';

  if (!fs.existsSync(input)) {
    console.error(`Input file ${input} not found`);
    process.exit(1);
  }

  const css = fs.readFileSync(input, 'utf8');

  try {
    const result = await postcss([
      tailwindcss(),
      autoprefixer(),
      prefixer({
        prefix: '.flare-admin',
        transform(prefix, selector, prefixedSelector, filePath, rule) {
          if (selector === ':root') {
            return selector;
          }
          if (selector === 'html' || selector === 'body') {
            return prefix;
          }
          return prefixedSelector;
        }
      })
    ]).process(css, { from: input, to: output });

    if (!fs.existsSync('./dist')) fs.mkdirSync('./dist', { recursive: true });
    fs.writeFileSync(output, result.css);
    console.log('Successfully built prefixed CSS to ./dist/style.css');
  } catch (err) {
    console.error('CSS Build failed:', err);
    process.exit(1);
  }
}

build();

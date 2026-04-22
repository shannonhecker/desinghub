/**
 * design-hub/no-hardcoded-tokens
 *
 * Flags Literal string nodes in src/data/** that contain raw hex colors,
 * rgba tuples, px values, or ms durations. These must resolve through
 * the DS token system (see docs/TOKENS.md).
 *
 * Allowlist (config):
 *   - allowInVariableNames: string[]   — skip when the literal lives inside
 *     a VariableDeclarator whose id.name matches (default: MATERIAL_COLORS,
 *     DENSITY_MAP / SIZE_MAP variants)
 *   - allowInPropertyNames: string[]   — skip when the literal is the value
 *     of an object Property whose key matches (default: cr, MATERIAL_COLORS)
 *
 * Suppression:
 *   // eslint-disable-next-line design-hub/no-hardcoded-tokens
 *
 * NOTE: ESLint can't see literals inside template-literal interpolations
 * produced by each DS's buildCSS. The scripts/tokens-audit.mjs grep sweep
 * is the backstop for those.
 */

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RGBA = /rgba?\(\s*\d/;
const PX = /\b\d+(?:\.\d+)?px\b/;
const MS = /\b\d+ms\b/;

const DEFAULT_ALLOW_VARIABLES = [
  'MATERIAL_COLORS',
  'SALT_DENSITY_MAP',
  'M3_DENSITY_MAP',
  'FLUENT_SIZE_MAP',
  'CARBON_DENSITY_MAP',
  'AUSOS_DENSITY_MAP',
  'DENSITY_MAP',
  'SIZE_MAP',
];

const DEFAULT_ALLOW_PROPERTIES = [
  // Carbon's flat cr:0 lives everywhere in density maps; also cases where a
  // single px value IS the token (spacing scale entry).
];

/** Walk ancestors to find the nearest VariableDeclarator name. */
function nearestVariableName(node) {
  let cur = node.parent;
  while (cur) {
    if (cur.type === 'VariableDeclarator' && cur.id && cur.id.type === 'Identifier') {
      return cur.id.name;
    }
    cur = cur.parent;
  }
  return null;
}

/** Walk ancestors to find the nearest object Property key name. */
function nearestPropertyName(node) {
  let cur = node.parent;
  while (cur) {
    if (cur.type === 'Property' && cur.key) {
      if (cur.key.type === 'Identifier') return cur.key.name;
      if (cur.key.type === 'Literal') return String(cur.key.value);
    }
    cur = cur.parent;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded design values in src/data/** — use DS tokens instead.',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowInVariableNames: { type: 'array', items: { type: 'string' } },
          allowInPropertyNames: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hex: 'Raw hex color "{{value}}" — resolve via var(--<ds>-color-*).',
      rgba: 'Raw rgba() "{{value}}" — resolve via var(--<ds>-color-*) or var(--<ds>-opacity-*).',
      px: 'Raw px value "{{value}}" — resolve via var(--<ds>-space-*), --<ds>-radius-*, --<ds>-type-size-*, or --<ds>-border-*.',
      ms: 'Raw ms duration "{{value}}" — resolve via var(--<ds>-dur-*).',
    },
  },
  create(context) {
    const opts = context.options[0] ?? {};
    const allowVars = new Set([...(opts.allowInVariableNames ?? DEFAULT_ALLOW_VARIABLES)]);
    const allowProps = new Set([...(opts.allowInPropertyNames ?? DEFAULT_ALLOW_PROPERTIES)]);

    function check(node, text) {
      const varName = nearestVariableName(node);
      if (varName && allowVars.has(varName)) return;
      const propName = nearestPropertyName(node);
      if (propName && allowProps.has(propName)) return;

      const hex = text.match(HEX);
      if (hex) context.report({ node, messageId: 'hex', data: { value: hex[0] } });
      const rgba = text.match(RGBA);
      if (rgba) context.report({ node, messageId: 'rgba', data: { value: rgba[0] } });
      const px = text.match(PX);
      if (px) context.report({ node, messageId: 'px', data: { value: px[0] } });
      const ms = text.match(MS);
      if (ms) context.report({ node, messageId: 'ms', data: { value: ms[0] } });
    }

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return;
        check(node, node.value);
      },
      TemplateElement(node) {
        const text = node.value?.cooked ?? node.value?.raw ?? '';
        if (!text) return;
        check(node, text);
      },
    };
  },
};

export default rule;

import fs from 'fs';

const files = [
  'mobile-app/src/app/(dealer)/home.tsx',
  'mobile-app/src/app/(dealer)/category/[id].tsx',
  'mobile-app/src/app/(dealer)/wishlist.tsx',
  'mobile-app/src/app/(dealer)/product/[id].tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace opacity logic
  content = content.replace(/isHabis && \{ opacity: 0\.6 \}/g, '(isHabis || isComingSoon) && { opacity: 0.6 }');

  // Replace habisOverlay styling for home, category, product, wishlist
  // Original patterns to look out for:
  // <View style={[styles.habisOverlay, isComingSoon && { backgroundColor: 'transparent' }]}>
  // <View style={[styles.habisOverlayList, isComingSoon && { backgroundColor: 'transparent' }]}>
  
  content = content.replace(
    /<View style={\[styles\.habisOverlay, isComingSoon && \{ backgroundColor: 'transparent' \}\]}>/g,
    '<View style={styles.habisOverlay}>\n                      {isComingSoon && <Feather name="star" size={24} color="#eab308" style={{ marginBottom: 4 }} />}'
  );
  
  content = content.replace(
    /<View style={\[styles\.habisOverlayList, isComingSoon && \{ backgroundColor: 'transparent' \}\]}>/g,
    '<View style={styles.habisOverlayList}>\n                      {isComingSoon && <Feather name="star" size={24} color="#eab308" style={{ marginBottom: 4 }} />}'
  );

  // For wishlist (different indentation or elements):
  // Let's just fix the text styles
  content = content.replace(
    /isComingSoon && \{ color: '#eab308', borderColor: '#eab308', textShadowColor: 'rgba\(0,0,0,0\.5\)' \}/g,
    "isComingSoon && { color: '#eab308', borderColor: '#eab308' }"
  );

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Done replacing styles');

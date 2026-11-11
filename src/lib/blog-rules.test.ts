import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

const root = process.cwd()
const firestore = readFileSync(path.join(root, 'firestore.rules'), 'utf8')
const storage = readFileSync(path.join(root, 'storage.rules'), 'utf8')
const robots = readFileSync(path.join(root, 'public/robots.txt'), 'utf8')

describe('security rules', () => {
  it('keeps websiteLeads create-only and does not open other collections', () => {
    assert.match(
      firestore,
      /match \/websiteLeads\/\{leadId\} \{\s*allow create: if request\.resource\.data\.type in \['trial', 'demo'\]\s*&& request\.resource\.data\.email is string\s*&& request\.resource\.data\.email\.size\(\) > 3\s*&& request\.resource\.data\.email\.size\(\) < 320;\s*allow read, update, delete: if false;\s*\}/
    )
    assert.match(firestore, /match \/blogs\/\{blogId\} \{[^}]*allow read: if resource\.data\.published == true;[^}]*allow create, update, delete: if false;/s)
    assert.match(firestore, /match \/settings\/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/)
    assert.match(firestore, /match \/comments\/\{commentId\} \{[^}]*allow read: if resource\.data\.approved == true;[^}]*request\.resource\.data\.approved == false/s)
    assert.match(firestore, /match \/analytics\/\{document=\*\*\} \{\s*allow read, write: if true;\s*\}/)
    const blogs = firestore.match(/match \/blogs\/\{blogId\} \{[\s\S]*?\n    \}/)
    assert.ok(blogs)
    assert.doesNotMatch(blogs[0], /allow read, write: if true/)
    assert.match(blogs[0], /allow create, update, delete: if false/)
  })

  it('stops public uploads to blog images', () => {
    assert.match(storage, /match \/blog-images\/\{allPaths=\*\*\} \{\s*allow read: if true;\s*allow write: if false;\s*\}/)
    assert.doesNotMatch(storage, /allow read, write, delete: if true/)
  })

  it('lets crawlers read Next assets, blocks admin, and points at the www sitemap', () => {
    assert.doesNotMatch(robots, /Disallow:\s*\/_next/)
    assert.match(robots, /Disallow:\s*\/admin/)
    assert.match(robots, /Sitemap:\s*https:\/\/www\.builderbase\.co\.nz\/sitemap\.xml/)
  })
})

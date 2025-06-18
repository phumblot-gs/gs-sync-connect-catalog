# Mapping et Règles de Transformation des Champs

## Objectif
Permettre de configurer, pour chaque synchronisation, un mapping flexible entre les champs du compte principal et ceux du compte secondaire, avec la possibilité d'appliquer des règles de transformation sur chaque champ.

---

## Liste des règles de transformation possibles

- **Renommage** : Changer le nom du champ source vers le champ cible (ex : `color` → `couleur`).
- **Conversion de casse** :
  - `uppercase` : tout en majuscules
  - `lowercase` : tout en minuscules
  - `capitalize` : première lettre en majuscule
- **Concaténation** : Fusionner plusieurs champs en un seul (ex : `brand` + `ref` → `brand_ref`).
- **Séparation/Jointure** :
  - `join` : transformer un tableau en string (ex : `tags` array → `tags_concat` string)
  - `split` : transformer une string en tableau
- **Mapping de valeurs** : Remplacer une valeur par une autre selon une table de correspondance (ex : `"Woman"` → `"Femme"`).
- **Valeur par défaut** : Si le champ est vide, utiliser une valeur par défaut.
- **Formatage de date** : Changer le format d'une date (ex : `2024-07-18` → `18/07/2024`).
- **Extraction** : Extraire une sous-partie d'un champ (ex : `extra.composition[0]` → `composition_principale`).
- **Transformation personnalisée** : Fonction JS simple (ex : arrondir un prix, tronquer un texte…)

---

## Stockage du mapping et des règles

Le mapping et les règles sont stockés en base, par exemple sous forme de JSON :

```json
{
  "color": {
    "target": "couleur",
    "rules": [
      { "type": "uppercase" }
    ]
  },
  "tags": {
    "target": "tags_concat",
    "rules": [
      { "type": "join", "separator": "," }
    ]
  },
  "gender": {
    "target": "sexe",
    "rules": [
      { "type": "value_map", "map": { "Woman": "Femme", "Man": "Homme" } }
    ]
  },
  "online": {
    "target": "date_mise_en_ligne",
    "rules": [
      { "type": "date_format", "from": "YYYY-MM-DD", "to": "DD/MM/YYYY" }
    ]
  },
  "brand": {
    "target": "marque",
    "rules": [
      { "type": "default", "value": "INCONNU" }
    ]
  }
}
```

---

## Exécution des règles

Lors de la synchronisation, chaque champ est transformé selon la liste des règles définies dans le mapping, dans l'ordre.

---

## Exemples concrets

- **Majuscules**
  - Source : `color` = `"pink"`
  - Règle : `uppercase`
  - Résultat : `couleur` = `"PINK"`

- **Mapping de valeurs**
  - Source : `gender` = `"Woman"`
  - Règle : `value_map` (`{"Woman": "Femme", "Man": "Homme"}`)
  - Résultat : `sexe` = `"Femme"`

- **Concaténation**
  - Source : `brand` = `"Nike"`, `ref` = `"AIRMAX"`
  - Règle : `concat`
  - Résultat : `brand_ref` = `"Nike AIRMAX"`

- **Valeur par défaut**
  - Source : `brand` = `""` (vide)
  - Règle : `default: 'INCONNU'`
  - Résultat : `marque` = `"INCONNU"`

- **Formatage de date**
  - Source : `online` = `"2024-07-18"`
  - Règle : `date_format` (`from: YYYY-MM-DD, to: DD/MM/YYYY`)
  - Résultat : `date_mise_en_ligne` = `"18/07/2024"`

---

## Mise en place dans l'interface

- Lors de la configuration d'une synchronisation, l'utilisateur peut :
  - Sélectionner le champ source et le champ cible
  - Ajouter une ou plusieurs règles de transformation via un menu déroulant ou un éditeur de mapping
  - Pour les règles nécessitant des paramètres (ex : mapping de valeurs, valeur par défaut), un formulaire adapté s'affiche
- Les mappings et règles sont sauvegardés en base et versionnés pour audit

---

## Points d'attention

- La validation du mapping est effectuée avant activation d'une synchronisation (cohérence, types, champs obligatoires)
- Les erreurs de transformation sont loguées et remontées dans le dashboard de monitoring 
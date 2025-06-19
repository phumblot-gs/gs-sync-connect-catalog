<!--
FRONT MATTER - Propriétés synchronisées avec Notion
====================================================
status: Draft | Review | Validated | Obsolete
plans: ["Free", "Growth", "Pro", "Enterprise"]
user_rights: ["Superadmin", "Admin", "Standard", "Restricted", "Guest"]
limite: Texte libre pour décrire les limitations (optionnel)
-->
---
status: Draft
plans: ["Free"]
user_rights: ["Admin", "Standard"]
---

# Mapping et Transformation


## 📋 Vue d'ensemble

Le module permet de synchroniser des données d'un compte GS vers un autre compte GS. Mais il peut arriver que la synchronisation nécessite des ajustements sur le contenu : mapping de valeurs, changement du format des dates, etc.
Permettre de configurer, pour chaque synchronisation, un mapping flexible entre les champs du compte principal et ceux du compte secondaire, avec la possibilité d'appliquer des règles de transformation sur chaque champ.

## 🎯 Objectifs

- [ ] Objectif principal 1
- [ ] Objectif principal 2
- [ ] Objectif principal 3


## Fonctionnalités


### Liste des règles de transformation

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


### Exécution des règles

Lors d'une synchronisation, chaque champ est transformé selon la liste des règles définies dans le mapping selon un ordre établi.

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



## 🏗️ Spécifications techniques

- La validation du mapping est effectuée avant activation d'une synchronisation (cohérence, types, champs obligatoires)
- Les erreurs de validation du mapping sont loguées et remontées dans le dashboard du monitoring
- Les erreurs de transformation sont loguées et remontées dans le dashboard de monitoring 


### APIs et endpoints

- `GET /api/feature` - Description
- `POST /api/feature` - Description


### Modèles de données

Le mapping et les règles sont stockés en base sous forme de JSON :

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


## 🎨 Spécifications UX/UI


### Wireframes

- Lors de la configuration d'une synchronisation, l'utilisateur peut :
  - Sélectionner le champ source et le champ cible
  - Ajouter une ou plusieurs règles de transformation via un menu déroulant ou un éditeur de mapping
  - Pour les règles nécessitant des paramètres (ex : mapping de valeurs, valeur par défaut), un formulaire adapté s'affiche

- Les mappings et règles sont sauvegardés en base et versionnés pour audit


### Interactions

- Action 1 → Résultat 1
- Action 2 → Résultat 2


## 🧪 Tests et validation


### Tests unitaires

- [ ] Test des fonctions principales
- [ ] Test des cas d'erreur
- [ ] Test des validations


### Tests d'intégration

- [ ] Test des APIs
- [ ] Test des interfaces utilisateur
- [ ] Test des workflows complets


### Tests utilisateur

- [ ] Test avec utilisateurs cibles
- [ ] Validation de l'expérience utilisateur
- [ ] Collecte de feedback


## 📈 Métriques de succès

- **Métrique 1** : Objectif X%
- **Métrique 2** : Objectif Y unités
- **Métrique 3** : Temps de réponse < Z ms


## 🚀 Plan de déploiement


### Phase 1 : MVP

- [ ] Fonctionnalité de base
- [ ] Tests essentiels
- [ ] Documentation minimale


### Phase 2 : Amélirations

- [ ] Fonctionnalités avancées
- [ ] Optimisations
- [ ] Tests complets


### Phase 3 : Finalisation

- [ ] Polissage UX
- [ ] Documentation complète
- [ ] Formation utilisateurs


## 🔗 Ressources et références

- [Lien vers la documentation technique](https://example.com/)
- [Lien vers les maquettes](https://example.com/)
- [Lien vers les spécifications API](https://example.com/)


## 📝 Notes et décisions


### Décisions techniques

- **Date** : Décision prise et justification
- **Date** : Autre décision importante


### Questions ouvertes

- [ ] Question 1 à résoudre
- [ ] Question 2 à clarifier

---
*Cette feature fait partie du projet GS Sync Connect Catalog.*
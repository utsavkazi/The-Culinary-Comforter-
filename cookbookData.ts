
import { CookbookRecipe } from './types';

export const COOKBOOK_RECIPES: CookbookRecipe[] = [
  {
    id: 'ginger-biscotti',
    title: 'Ginger Biscotti',
    author: 'Beth Fish Reads',
    category: 'Dessert',
    page: 4,
    preview: 'A Renaissance-inspired adaptation of a family recipe dating back to the late 1800s, featuring pine nuts and crystallized ginger.',
    ingredients: [
      '1 1/4 cup granulated sugar',
      '1 cup unsalted butter, room temperature',
      '3 eggs',
      '1 teaspoon vanilla extract',
      '1 teaspoon salt',
      '1 teaspoon baking powder',
      '4 cups all-purpose flour',
      '1 cup pine nuts',
      '1/2 cup mini diced crystallized ginger',
      '1 teaspoon ground cinnamon'
    ],
    instructions: [
      'Preheat the oven to 350°F. Grease two large baking sheets or line with parchment.',
      'Cream the butter and 1 cup of the sugar until light and fluffy. Add the eggs, one at a time, beating until incorporated. Add the vanilla, and beat until incorporated.',
      'Mix the salt, baking powder and flour in a medium bowl. Stir in the pine nuts and ginger. Add gradually to the egg mixture and mix well.',
      'Divide the dough into 4 equal parts. Shape each part into a small, flat rectangle, 3/4 to 1 inch high. Lightly score the top (7-8 slices per loaf). Bake 30 to 40 minutes.',
      'Mix remaining 1/4 cup sugar with cinnamon. Remove loaves, cut along score lines, sprinkle with cinnamon-sugar, and bake another 12 to 15 minutes.'
    ]
  },
  {
    id: 'ciambelle',
    title: 'Ciambelle',
    author: 'Crystal King',
    category: 'Bread',
    page: 5,
    preview: 'Renaissance-style boiled and baked rings, similar to a bagel, flavored with rosewater and anise.',
    ingredients: [
      '4 c. flour',
      '1/2 tsp salt',
      '1 packet of active dry yeast',
      '1/4 cup and 1 tbsp sugar',
      '2 tsp rosewater',
      '1 1/4 cup goat milk (or whole milk)',
      '2 beaten eggs',
      '2 tbsp anise or fennel seeds'
    ],
    instructions: [
      'Warm goat milk, add sugar and yeast; let sit until bubbly.',
      'Mix rosewater and eggs; add to yeast mixture.',
      'Mix fennel seeds and salt into flour. Combine with wet ingredients to form dough.',
      'Knead well, cover, and rise for 45 minutes.',
      'Boil water. Divide dough into 8 parts, roll into ropes and form rings.',
      'Boil rings for one minute (they will rise to the top).',
      'Place on oiled baking sheet, sprinkle with seeds, and bake at 375°F for 40-50 minutes.'
    ]
  },
  {
    id: 'testaroli',
    title: 'Testaroli (Pancake Pasta)',
    author: 'Francine Segan',
    category: 'Pasta',
    page: 6,
    preview: 'A spongy Renaissance pancake from Liguria that is cut into pieces and boiled like pasta.',
    ingredients: [
      '1/2 cup 00 or all-purpose flour',
      '1/2 cup whole wheat or corn flour',
      'Olive oil',
      'Salt',
      '1/2 onion',
      '3/4 cup pesto or grated pecorino'
    ],
    instructions: [
      'Combine flours, 1 1/2 tbsp olive oil, salt, and 2 cups water to make a thin batter. Rest 10 minutes.',
      'Heat a pan, grease with onion dipped in oil. Cook thin layers of batter like crepes (7-10 mins first side, 5 mins second side).',
      'Cool and store for at least 12 hours.',
      'Cut into rectangles. Drop in boiling salted water, turn off heat, and soak for 2-3 minutes. Serve with pesto.'
    ]
  },
  {
    id: 'meatballs-pine-nuts',
    title: 'Meatballs with Pine Nuts and Roasted Cipollini Onions',
    author: 'Vanessa Baca',
    category: 'Main',
    page: 7,
    preview: 'Sophisticated meatballs featuring Asiago cheese and toasted pine nuts, served with a balsamic reduction.',
    ingredients: [
      '1/2 cup toasted pine nuts',
      '1 pound ground beef',
      '1 pound ground pork',
      '6 cloves garlic, minced',
      'Asiago cheese, parsley, sage, salt, pepper, 2 eggs',
      '12 cipollini onions',
      '3 sprigs rosemary',
      '2 cups balsamic vinegar'
    ],
    instructions: [
      'Toast pine nuts. Mix beef, pork, garlic, herbs, cheese, nuts, and eggs. Form balls and bake at 400°F for 30 minutes.',
      'Sauté cipollini onions in butter with rosemary. Roast at 350°F for 35 minutes.',
      'Reduce balsamic vinegar with a crushed garlic clove until syrupy. Pour over meatballs and onions.'
    ]
  },
  {
    id: 'turkey-tortelli',
    title: 'Turkey Tortelli with Burnt Cinnamon Brodetto',
    author: 'Chef Michael Pagliarini',
    category: 'Pasta',
    page: 9,
    preview: 'Exquisite tortelli stuffed with turkey, prosciutto, and mortadella, served in a broth infused with burnt cinnamon.',
    ingredients: [
      '200g turkey leg meat',
      '4 shallots',
      '1/4 cup white wine',
      '100g Parmigiano cheese',
      '100g diced prosciutto',
      '100g mortadella',
      '1/2 stick cinnamon (burnt)',
      'Nutmeg, aromatic herbs, 2 eggs, pasta dough'
    ],
    instructions: [
      'Pan-fry turkey in butter, deglaze with wine. Roast shallots until soft.',
      'Process turkey, shallots, cheeses, meats, and spices into a smooth filling.',
      'Form tortellini with fresh pasta dough.',
      'Cook in turkey broth infused with burnt cinnamon and sage. Serve with grated cheese.'
    ]
  },
  {
    id: 'fried-chicken',
    title: "Scappi's Fried Chicken",
    author: 'Crystal King',
    category: 'Main',
    page: 16,
    preview: 'A Renaissance take on fried chicken using a marinade of white wine, vinegar, and grape must.',
    ingredients: [
      '3 legs, 3 thighs',
      '1 1/4 cup white wine',
      '2 tbsp grape must (or vincotto)',
      '1/2 cup white wine vinegar',
      'Cinnamon, cloves, coriander, nutmeg, garlic',
      'Flour for dredging, oil for frying'
    ],
    instructions: [
      'Marinate chicken in wine, must, vinegar, and spices for 8+ hours.',
      'Dredge chicken in seasoned flour.',
      'Fry in 350°F oil with lid on for 10 mins. Remove lid, turn, and fry 15-20 mins more until golden.'
    ]
  },
  {
    id: 'braised-beef',
    title: "Scappi's Braised Beef",
    author: 'Crystal King',
    category: 'Main',
    page: 18,
    preview: 'A rich winter dish featuring beef short ribs braised with vincotto, rose vinegar, prunes, and cherries.',
    ingredients: [
      '2 lb beef short rib',
      'Pepper, cloves, cinnamon, ginger, coriander',
      '3/4 cup Madeira wine',
      '1/4 cup vincotto',
      '1/4 cup rose vinegar',
      'Bacon, prosciutto, prunes, cherries'
    ],
    instructions: [
      'Rub meat with spices. Marinate in wine, vincotto, and rose vinegar for 4 hours.',
      'Brown bacon and sear meat in a dutch oven.',
      'Add marinade and meats to pot. Braise at 295°F for 4 hours.',
      'Add prunes and cherries at the 3-hour mark. Reduce sauce before serving.'
    ]
  },
  {
    id: 'pumpkin-tourte',
    title: 'Pumpkin Tourte',
    author: 'Crystal King',
    category: 'Dessert',
    page: 28,
    preview: 'Thought to be the first pumpkin pie recipe ever printed, dating back to 1570.',
    ingredients: [
      '15 oz canned pumpkin',
      '8 oz cream cheese, 1/4 cup ricotta',
      '3/4 cup sugar, 3 eggs',
      '4 oz butter, 3 tsp cinnamon',
      '2-3 tbsp fresh ginger',
      'Two 9" pie shells'
    ],
    instructions: [
      'Preheat oven to 375°F. Cream milk, sugar, eggs, and butter.',
      'Blend in cheeses, pumpkin, ginger, and cinnamon until smooth.',
      'Pour into pie shells and bake for 45-50 minutes.'
    ]
  }
];

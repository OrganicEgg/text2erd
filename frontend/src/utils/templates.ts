export interface PresetTemplate {
  name: string;
  description: string;
  draft: string;
}

export const TEMPLATES: PresetTemplate[] = [
  {
    name: "E-Commerce",
    description: "Users, Products, Categories, Orders, and Order Items",
    draft: `users
  id int pk
  email varchar(255) unique not null
  name varchar(100) not null
  created_at timestamp

categories
  id int pk
  slug varchar(50) unique not null
  title varchar(100) not null

products
  id int pk
  category_id int -> categories.id
  title varchar(200) not null
  price decimal(10,2) not null
  stock int

orders
  id int pk
  user_id int -> users.id
  total_amount decimal(10,2) not null
  status varchar(50)
  created_at timestamp

order_items
  id int pk
  order_id int -> orders.id
  product_id int -> products.id
  quantity int not null
  unit_price decimal(10,2) not null`
  },
  {
    name: "Blog & Social",
    description: "Users, Profiles, Posts, Comments, and Tags",
    draft: `users
  id int pk
  username varchar(50) unique not null
  email varchar(255) unique not null
  created_at timestamp

profiles
  id int pk
  user_id int -> users.id
  bio text
  avatar_url varchar(255)

posts
  id int pk
  author_id int -> users.id
  title varchar(255) not null
  content text
  published boolean
  created_at timestamp

comments
  id int pk
  post_id int -> posts.id
  author_id int -> users.id
  body text not null
  created_at timestamp

tags
  id int pk
  name varchar(50) unique not null

post_tags
  post_id int -> posts.id
  tag_id int -> tags.id`
  },
  {
    name: "Project Management",
    description: "Organizations, Members, Projects, Tasks, and Labels",
    draft: `organizations
  id uuid pk
  name varchar(100) not null
  plan varchar(50)

users
  id uuid pk
  org_id uuid -> organizations.id
  email varchar(255) unique not null
  role varchar(50)

projects
  id uuid pk
  org_id uuid -> organizations.id
  name varchar(100) not null
  description text

tasks
  id uuid pk
  project_id uuid -> projects.id
  assignee_id uuid -> users.id
  title varchar(200) not null
  status varchar(50)
  priority varchar(20)
  due_date timestamp`
  }
];

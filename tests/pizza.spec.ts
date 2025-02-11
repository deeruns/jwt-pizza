import { test, expect } from 'playwright-test-coverage';

//mock tests, we aren't doing integration testing
//we are mocking out the backend service
// need to also start backend code

test('home page', async ({ page }) => {
    await page.goto('/');
  
    expect(await page.title()).toBe('JWT Pizza');
  });

test('buy pizza with login', async ({ page }) => {
    await page.route('*/**/api/order/menu', async (route) => {
      const menuRes = [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: menuRes });
    });
  
    await page.route('*/**/api/franchise', async (route) => {
      const franchiseRes = [
        {
          id: 2,
          name: 'LotaPizza',
          stores: [
            { id: 4, name: 'Lehi' },
            { id: 5, name: 'Springville' },
            { id: 6, name: 'American Fork' },
          ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: franchiseRes });
    });
  
    await page.route('*/**/api/auth', async (route) => {
      const loginReq = { email: 'd@jwt.com', password: 'a' };
      const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    });
  
    await page.route('*/**/api/order', async (route) => {
      const orderReq = {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
      };
      const orderRes = {
        order: {
          items: [
            { menuId: 1, description: 'Veggie', price: 0.0038 },
            { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          ],
          storeId: '4',
          franchiseId: 2,
          id: 23,
        },
        jwt: 'eyJpYXQ',
      };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(orderReq);
      await route.fulfill({ json: orderRes });
    });
  
    await page.goto('/');
  
    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();
  
    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
  
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill('d@jwt.com');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();
  
    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();
  
    // Check balance
    await expect(page.getByText('0.008')).toBeVisible();
//   await page.goto('http://localhost:5173/');
//   await page.getByRole('button', { name: 'Order now' }).click();
//   await expect(page.locator('h2')).toContainText('Awesome is a click away');
//   await page.getByRole('combobox').selectOption('1');
//   await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
//   await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
//   await page.getByRole('button', { name: 'Checkout' }).click();
//   await page.goto('http://localhost:5173/payment/login');
//   await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
//   await page.getByRole('textbox', { name: 'Password' }).click();
//   await page.getByRole('textbox', { name: 'Password' }).fill('admin');
//   await page.getByRole('button', { name: 'Login' }).click();
//   await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
//   await expect(page.locator('tbody')).toContainText('Veggie');
//   await page.getByRole('button', { name: 'Pay now' }).click();
//   await expect(page.getByRole('main')).toContainText('0.008 ₿');
});

test('navigate to admin profile', async ({ page }) => { 
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await page.getByRole('link', { name: '常' }).click();
  
  await expect(page.getByRole('main')).toContainText('常用名字');
  await expect(page.getByRole('main')).toContainText('a@jwt.com');
  await expect(page.getByRole('main')).toContainText('admin');
  await expect(page.getByRole('main')).toContainText('Here is your history of all the good times.');
  await page.getByRole('link', { name: 'Logout' }).click();
  });

  test('create and close franchise', async ({ page }) => { 
    await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByRole('main')).toContainText('Keep the dough rolling and the franchises signing up.');
    await expect(page.getByRole('table')).toContainText('pizzaPocket');
    await expect(page.getByRole('table')).toContainText('testPizzaFranchise');
    
    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await expect(page.locator('form')).toContainText('Want to create franchise?');
    await page.getByRole('textbox', { name: 'franchise name' }).click();
    await page.getByRole('textbox', { name: 'franchise name' }).fill('deliverable4franchise');
    await page.getByRole('textbox', { name: 'franchisee admin email' }).click();
    await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('a@jwt.com');
    
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('table')).toContainText('deliverable4franchise');
    await expect(page.getByRole('table')).toContainText('常用名字');
    await page.getByRole('row', { name: 'deliverable4franchise 常用名字' }).getByRole('button').click();
    await expect(page.getByRole('main')).toContainText('Are you sure you want to close the deliverable4franchise franchise? This will close all associated stores and cannot be restored. All outstanding revenue with not be refunded.');
    await page.getByRole('button', { name: 'Close' }).click();
    });

    test('about page', async ({ page }) => { 
      // go to the about page and look at it
      await page.goto('/');
      await page.getByRole('link', { name: 'About' }).click();
      await expect(page.getByRole('main')).toContainText('The secret sauce');
      await expect(page.getByRole('main')).toContainText('At JWT Pizza, our amazing employees are the secret behind our delicious pizzas. They are passionate about their craft and spend every waking moment dreaming about how to make our pizzas even better. From selecting the finest ingredients to perfecting the dough and sauce recipes, our employees go above and beyond to ensure the highest quality and taste in every bite. Their dedication and attention to detail make all the difference in creating a truly exceptional pizza experience for our customers. We take pride in our team and their commitment to delivering the best pizza in town.');
      await page.getByRole('link', { name: 'History' }).click();
      await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
    });

    test('franchise dashboard, create and close a store', async ({ page }) => { 

      await page.goto('http://localhost:5173/');
    
      await page.getByRole('link', { name: 'Login' }).click();
      await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
      await page.getByRole('textbox', { name: 'Password' }).click();
      await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.getByRole('heading')).toContainText('The web\'s best pizza');
      await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
      await expect(page.getByRole('main')).toContainText('Everything you need to run an JWT Pizza franchise. Your gateway to success.');
    
      //create store
      await page.getByRole('button', { name: 'Create store' }).click();
      await page.getByRole('textbox', { name: 'store name' }).click();
      await page.getByRole('textbox', { name: 'store name' }).fill('teststore');
      await page.getByRole('button', { name: 'Create' }).click();
      //close store
      await page.getByRole('row', { name: 'teststore 0 ₿ Close' }).getByRole('button').click();
      await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
      await page.getByRole('button', { name: 'Close' }).click();
    });

    test('register and logout', async ({ page }) => { 
      //check
      await page.route('*/**/api/auth', async (route) =>{
        const registerReq = {
          "name": "dee",
          "email": "dee@jwt.com",
          "password": "dee"
        }
        const registerRes = {
          "user": {
            "name": "dee",
            "email": "dee@jwt.com",
            "roles": [
              {
                "role": "diner"
              }
            ],
            "id": 1065
          },
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZGVlIiwiZW1haWwiOiJkZWVAand0LmNvbSIsInJvbGVzIjpbeyJyb2xlIjoiZGluZXIifV0sImlkIjoxMDY1LCJpYXQiOjE3MzkzMDA0MDF9.6DMmChliJErzcVu_I7diF8ReuxJ-YGt1HvrCcy4XKE4"
        }
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toMatchObject(registerReq);
        await route.fulfill({ json: registerRes });
      })
      await page.route('*/**/api/auth', async (route) =>{
        const logoutRes = {"message": "logout successful"}
        expect(route.request().method()).toBe('DELETE');
        await route.fulfill({ json: logoutRes });
      })
      //await page.goto('/');
      //await page.getByRole('link', { name: 'Logout' }).click();
    });
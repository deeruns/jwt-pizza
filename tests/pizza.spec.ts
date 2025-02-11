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
});

test('navigate to admin profile', async ({ page }) => { 
  
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'a@jwt.com', password: 'admin' };
    const loginRes = {
      "user": {
        "id": 1,
        "name": "常用名字",
        "email": "a@jwt.com",
        "roles": [
          {
            "role": "admin"
          }
        ]
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IuW4uOeUqOWQjeWtlyIsImVtYWlsIjoiYUBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJhZG1pbiJ9XSwiaWF0IjoxNzM5MzA0MDEwfQ.mqGai4yWz0VexlAQLsxeWBPCOk4wfxv-YdZESImxFiY"
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  // await page.route('*/**/api/auth', async (route) =>{
  //   const logoutRes = {"message": "logout successful"}
  //   expect(route.request().method()).toBe('DELETE');
  //   await route.fulfill({ json: logoutRes });
  // });

  await page.goto('/');
  
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  // go to admin profile
  await page.getByRole('link', { name: '常' }).click();
  await expect(page.getByRole('main')).toContainText('常用名字');
  await expect(page.getByRole('main')).toContainText('a@jwt.com');
  await expect(page.getByRole('main')).toContainText('admin');
  //await page.getByRole('link', { name: 'Logout' }).click();
  });

  test('create and close franchise', async ({ page }) => { 
    //login
    await page.route('*/**/api/auth', async (route) => {
      const loginReq = { email: 'a@jwt.com', password: 'admin' };
      const loginRes = {
        "user": {
          "id": 1,
          "name": "admin",
          "email": "a@jwt.com",
          "roles": [
            {
              "role": "admin"
            }
          ]
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IuW4uOeUqOWQjeWtlyIsImVtYWlsIjoiYUBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJhZG1pbiJ9XSwiaWF0IjoxNzM5MzA1MTczfQ.IU8mfzGeFNJN-zmeyP-pjgigZczveYYGs2praRZfBiw"
      };
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    });

    //franchise page
    // await page.route('*/**/api/franchise', async (route) => {
    //   const franchiseRes = [
    //     {
    //       "id": 12,
    //       "name": "Davins Franchise",
    //       "admins": [
    //         {
    //           "id": 511,
    //           "name": "2mg2o6jb4s",
    //           "email": "2mg2o6jb4s@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 48,
    //       "name": "Dee Franchise",
    //       "admins": [
    //         {
    //           "id": 591,
    //           "name": "uu70j49wxb",
    //           "email": "uu70j49wxb@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 42,
    //       "name": "Dees Franchise",
    //       "admins": [
    //         {
    //           "id": 586,
    //           "name": "3t7eyi2ih9",
    //           "email": "3t7eyi2ih9@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 52,
    //       "name": "Deez Franchise",
    //       "admins": [
    //         {
    //           "id": 599,
    //           "name": "7dpns3nbrn",
    //           "email": "7dpns3nbrn@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 25,
    //       "name": "Franchise for Store",
    //       "admins": [
    //         {
    //           "id": 545,
    //           "name": "p5kl9lc3lq",
    //           "email": "p5kl9lc3lq@admin.com"
    //         }
    //       ],
    //       "stores": [
    //         {
    //           "id": 39,
    //           "name": "New Pizza Store",
    //           "totalRevenue": 0
    //         }
    //       ]
    //     },
    //     {
    //       "id": 8,
    //       "name": "New Franchise",
    //       "admins": [
    //         {
    //           "id": 499,
    //           "name": "tabeeyv2u6",
    //           "email": "tabeeyv2u6@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 39,
    //       "name": "new Franchise for new store",
    //       "admins": [
    //         {
    //           "id": 578,
    //           "name": "tcbenmsiyz",
    //           "email": "tcbenmsiyz@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 1,
    //       "name": "pizzaPocket",
    //       "admins": [
    //         {
    //           "id": 4,
    //           "name": "pizza franchisee",
    //           "email": "f@jwt.com"
    //         }
    //       ],
    //       "stores": [
    //         {
    //           "id": 1,
    //           "name": "SLC",
    //           "totalRevenue": 1.848
    //         },
    //         {
    //           "id": 2,
    //           "name": "SLC",
    //           "totalRevenue": 0
    //         }
    //       ]
    //     },
    //     {
    //       "id": 5,
    //       "name": "testPizzaFranchise",
    //       "admins": [
    //         {
    //           "id": 4,
    //           "name": "pizza franchisee",
    //           "email": "f@jwt.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 3,
    //       "name": "testPizzaPocket",
    //       "admins": [
    //         {
    //           "id": 4,
    //           "name": "pizza franchisee",
    //           "email": "f@jwt.com"
    //         }
    //       ],
    //       "stores": []
    //     }
    //   ];
    //   expect(route.request().method()).toBe('GET');
    //   await route.fulfill({ json: franchiseRes });
    // });

    //create franchise
    // await page.route('*/**/api/franchise', async (route) => {
    //   const franchiseCreateReq = {
    //     "stores": [],
    //     "id": "",
    //     "name": "rand",
    //     "admins": [
    //       {
    //         "email": "a@jwt.com"
    //       }
    //     ]
    //   };
    //   const franchiseCreateRes = {
    //     "stores": [],
    //     "id": 239,
    //     "name": "rand",
    //     "admins": [
    //       {
    //         "email": "a@jwt.com",
    //         "id": 1,
    //         "name": "常用名字"
    //       }
    //     ]
    //   };
    //   expect(route.request().method()).toBe('POST');
    //   expect(route.request().postDataJSON()).toMatchObject(franchiseCreateReq);
    //   await route.fulfill({ json: franchiseCreateRes });
    // });
    let createdFranchiseId: number; // Variable to store the new franchise ID

    await page.route('*/**/api/franchise', async (route) => {
      if (route.request().method() === 'POST') {
        const franchiseCreateReq = {
          "stores": [],
          "id": "",
          "name": "rand",
          "admins": [{ "email": "a@jwt.com" }]
        };
        
        createdFranchiseId = Math.floor(Math.random() * 1000) + 200; // Simulate a dynamic ID
        const franchiseCreateRes = {
          "stores": [],
          "id": createdFranchiseId,
          "name": "rand",
          "admins": [{ "email": "a@jwt.com", "id": 1, "name": "常用名字" }]
        };
        
        expect(route.request().method()).toBe('POST');
        expect(route.request().postDataJSON()).toMatchObject(franchiseCreateReq);
        await route.fulfill({ json: franchiseCreateRes });
      } else if (route.request().method() === 'GET') {
        // Simulate the franchise list after creation
        const franchiseRes = [
          { "id": createdFranchiseId, "name": "rand", "admins": [{ "id": 1, "name": "常用名字", "email": "a@jwt.com" }], "stores": [] }
        ];
        await route.fulfill({ json: franchiseRes });
      }
    });


    //look at franchises again
    // await page.route('*/**/api/franchise', async (route) => {
    //   const franchiseRes = [
    //     {
    //       "id": 12,
    //       "name": "Davins Franchise",
    //       "admins": [
    //         {
    //           "id": 511,
    //           "name": "2mg2o6jb4s",
    //           "email": "2mg2o6jb4s@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 48,
    //       "name": "Dee Franchise",
    //       "admins": [
    //         {
    //           "id": 591,
    //           "name": "uu70j49wxb",
    //           "email": "uu70j49wxb@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 42,
    //       "name": "Dees Franchise",
    //       "admins": [
    //         {
    //           "id": 586,
    //           "name": "3t7eyi2ih9",
    //           "email": "3t7eyi2ih9@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 52,
    //       "name": "Deez Franchise",
    //       "admins": [
    //         {
    //           "id": 599,
    //           "name": "7dpns3nbrn",
    //           "email": "7dpns3nbrn@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 239,
    //       "name": "rand",
    //       "admins": [
    //         {
    //           "id": 1,
    //           "name": "常用名字",
    //           "email": "a@jwt.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 25,
    //       "name": "Franchise for Store",
    //       "admins": [
    //         {
    //           "id": 545,
    //           "name": "p5kl9lc3lq",
    //           "email": "p5kl9lc3lq@admin.com"
    //         }
    //       ],
    //       "stores": [
    //         {
    //           "id": 39,
    //           "name": "New Pizza Store",
    //           "totalRevenue": 0
    //         }
    //       ]
    //     },
    //     {
    //       "id": 8,
    //       "name": "New Franchise",
    //       "admins": [
    //         {
    //           "id": 499,
    //           "name": "tabeeyv2u6",
    //           "email": "tabeeyv2u6@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 39,
    //       "name": "new Franchise for new store",
    //       "admins": [
    //         {
    //           "id": 578,
    //           "name": "tcbenmsiyz",
    //           "email": "tcbenmsiyz@admin.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 1,
    //       "name": "pizzaPocket",
    //       "admins": [
    //         {
    //           "id": 4,
    //           "name": "pizza franchisee",
    //           "email": "f@jwt.com"
    //         }
    //       ],
    //       "stores": [
    //         {
    //           "id": 1,
    //           "name": "SLC",
    //           "totalRevenue": 1.848
    //         },
    //         {
    //           "id": 2,
    //           "name": "SLC",
    //           "totalRevenue": 0
    //         }
    //       ]
    //     },
    //     {
    //       "id": 5,
    //       "name": "testPizzaFranchise",
    //       "admins": [
    //         {
    //           "id": 4,
    //           "name": "pizza franchisee",
    //           "email": "f@jwt.com"
    //         }
    //       ],
    //       "stores": []
    //     },
    //     {
    //       "id": 3,
    //       "name": "testPizzaPocket",
    //       "admins": [
    //         {
    //           "id": 4,
    //           "name": "pizza franchisee",
    //           "email": "f@jwt.com"
    //         }
    //       ],
    //       "stores": []
    //     }
    //   ]
    //   expect(route.request().method()).toBe('GET');
    //   await route.fulfill({ json: franchiseRes });
    // });

    // await page.route('*/**/api/franchise/234', async (route) => {
    //   const deleteRes = {
    //     "message": "franchise deleted"
    //   };
    //   expect(route.request().method()).toBe('DELETE');
    //   await route.fulfill({ json: deleteRes });
    // });

    await page.route(new RegExp(`.*/api/franchise/\\d+$`), async (route) => {
      const requestedUrl = route.request().url();
      const franchiseIdMatch = requestedUrl.match(/\/api\/franchise\/(\d+)$/);
      const franchiseIdInUrl = franchiseIdMatch ? franchiseIdMatch[1] : null;
    
      expect(route.request().method()).toBe('DELETE');
      expect(Number(franchiseIdInUrl)).toBe(createdFranchiseId); // Ensure it's deleting the right franchise
    
      const deleteRes = { "message": "franchise deleted" };
      await route.fulfill({ json: deleteRes });
    });
    

    await page.goto('/');
    //await page.goto('http://localhost:5173/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByRole('heading')).toContainText('Mama Ricci\'s kitchen');
    await expect(page.getByRole('main')).toContainText('Keep the dough rolling and the franchises signing up.');
    
    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await page.getByRole('textbox', { name: 'franchise name' }).click();
    await page.getByRole('textbox', { name: 'franchise name' }).fill('rand');
    await page.getByRole('textbox', { name: 'franchisee admin email' }).click();
    await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('a@jwt.com');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('table')).toContainText('rand');
    await page.getByRole('row', { name: 'rand 常用名字 Close' }).getByRole('button').click();
    await expect(page.getByRole('main')).toContainText('Are you sure you want to close the rand franchise? This will close all associated stores and cannot be restored. All outstanding revenue with not be refunded.');
    await page.getByRole('button', { name: 'Close' }).click();
    //await page.getByRole('link', { name: 'Logout' }).click();
    
     });

    test('about page', async ({ page }) => { 
      // go to the about page and look at it
      //check
      await page.goto('/');
      await page.getByRole('link', { name: 'About' }).click();
      await expect(page.getByRole('main')).toContainText('The secret sauce');
      await expect(page.getByRole('main')).toContainText('At JWT Pizza, our amazing employees are the secret behind our delicious pizzas. They are passionate about their craft and spend every waking moment dreaming about how to make our pizzas even better. From selecting the finest ingredients to perfecting the dough and sauce recipes, our employees go above and beyond to ensure the highest quality and taste in every bite. Their dedication and attention to detail make all the difference in creating a truly exceptional pizza experience for our customers. We take pride in our team and their commitment to delivering the best pizza in town.');
      await page.getByRole('link', { name: 'History' }).click();
      await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
    });

    test('franchise dashboard, create and close a store', async ({ page }) => { 
      //check
      //login
      await page.route('*/**/api/auth', async (route) =>{
        const loginReq = {
          "email": "f@jwt.com",
          "password": "franchisee"
        };
        const loginRes = {
          "user": {
            "id": 4,
            "name": "pizza franchisee",
            "email": "f@jwt.com",
            "roles": [
              {
                "objectId": 1,
                "role": "franchisee"
              },
              {
                "objectId": 3,
                "role": "franchisee"
              },
              {
                "objectId": 5,
                "role": "franchisee"
              }
            ]
          },
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwibmFtZSI6InBpenphIGZyYW5jaGlzZWUiLCJlbWFpbCI6ImZAand0LmNvbSIsInJvbGVzIjpbeyJvYmplY3RJZCI6MSwicm9sZSI6ImZyYW5jaGlzZWUifSx7Im9iamVjdElkIjozLCJyb2xlIjoiZnJhbmNoaXNlZSJ9LHsib2JqZWN0SWQiOjUsInJvbGUiOiJmcmFuY2hpc2VlIn1dLCJpYXQiOjE3MzkzMDE4NzV9.aB7c5PHI1cL4WxKzJNhzd4PBwjUnM6u53UKIoeGJz2U"
        };
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
      })
      
      //franchise tab?
      await page.route('*/**/api/franchise/4', async (route) => {
        const franchiseRes = [
          {
            "id": 1,
            "name": "pizzaPocket",
            "admins": [
              {
                "id": 4,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": [
              {
                "id": 1,
                "name": "SLC",
                "totalRevenue": 1.848
              },
              {
                "id": 2,
                "name": "SLC",
                "totalRevenue": 0
              }
            ]
          },
          {
            "id": 3,
            "name": "testPizzaPocket",
            "admins": [
              {
                "id": 4,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": []
          },
          {
            "id": 5,
            "name": "testPizzaFranchise",
            "admins": [
              {
                "id": 4,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": []
          }
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: franchiseRes });
      });

      await page.route('*/**/api/franchise/1/store', async (route) => {
        const createStoreReq = {
          "id": "",
          "name": "teststore"
        };
        const createStoreRes = {
          "id": 121,
          "franchiseId": 1,
          "name": "teststore"
        };
        expect(route.request().method()).toBe('POST');
        await route.fulfill({ json: createStoreRes });
      });

      //franchise after store creation
      await page.route('*/**/api/franchise/4', async (route) => {
        const franchiseResp = [
          {
            "id": 1,
            "name": "pizzaPocket",
            "admins": [
              {
                "id": 4,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": [
              {
                "id": 1,
                "name": "SLC",
                "totalRevenue": 1.848
              },
              {
                "id": 2,
                "name": "SLC",
                "totalRevenue": 0
              },
              {
                "id": 121,
                "name": "teststore",
                "totalRevenue": 0
              }
            ]
          },
          {
            "id": 3,
            "name": "testPizzaPocket",
            "admins": [
              {
                "id": 4,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": []
          },
          {
            "id": 5,
            "name": "testPizzaFranchise",
            "admins": [
              {
                "id": 4,
                "name": "pizza franchisee",
                "email": "f@jwt.com"
              }
            ],
            "stores": []
          }
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: franchiseResp });
      });
      
      //delete the store
      await page.route('*/**/api/franchise/1/store/121', async (route) => {
        expect(route.request().method()).toBe('DELETE');
        //await route.fulfill({ json: createStoreRes });
        await route.fulfill({
          status: 204,  // No Content response
        });
      });

      await page.goto('/');

      await page.getByRole('link', { name: 'Login' }).click();
      await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
      await page.getByRole('textbox', { name: 'Password' }).click();
      await page.getByRole('textbox', { name: 'Password' }).fill('franchisee');
      await page.getByRole('button', { name: 'Login' }).click();

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
      //register new user
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
      });
      
      //logout user
      await page.route('*/**/api/auth', async (route) =>{
        const logoutRes = {"message": "logout successful"}
        expect(route.request().method()).toBe('DELETE');
        await route.fulfill({ json: logoutRes });
      });
      //do i need to delete the user?
      //await page.goto('/');
      //await page.getByRole('link', { name: 'Logout' }).click();
    });
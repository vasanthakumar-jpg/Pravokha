import { prisma } from '../config/db';

export class ProductService {
    static async createProduct(dealerId: string, data: any) {
        return await prisma.product.create({
            data: {
                ...data,
                dealerId,
            },
        });
    }

    static async getProducts(user: { id: string; role: string }) {
        if (user.role === 'ADMIN') {
            return await prisma.product.findMany({ include: { dealer: { select: { name: true, email: true } } } });
        } else {
            return await prisma.product.findMany({ where: { dealerId: user.id } });
        }
    }

    static async getProductById(id: string, user: { id: string; role: string }) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw { statusCode: 404, message: 'Product not found' };
        }

        if (user.role !== 'ADMIN' && product.dealerId !== user.id) {
            throw { statusCode: 403, message: 'Forbidden' };
        }
        return product;
    }

    static async updateProduct(id: string, user: { id: string; role: string }, data: any) {
        const product = await this.getProductById(id, user); // Checks existence and permission

        return await prisma.product.update({
            where: { id },
            data,
        });
    }

    static async deleteProduct(id: string, user: { id: string; role: string }) {
        const product = await this.getProductById(id, user); // Checks existence and permission

        return await prisma.product.delete({
            where: { id },
        });
    }
}

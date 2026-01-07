import { prisma } from '../../infra/database/client';
import { Product, Role } from '@prisma/client';

export class ProductService {
    static async createProduct(dealerId: string, data: Omit<Product, 'id' | 'dealerId' | 'createdAt' | 'updatedAt'>) {
        return await prisma.product.create({
            data: {
                ...data,
                dealerId,
            },
        });
    }

    static async getProducts(user: { id: string; role: Role }) {
        if (user.role === Role.ADMIN) {
            return await prisma.product.findMany({ include: { dealer: { select: { name: true, email: true } } } });
        } else {
            return await prisma.product.findMany({ where: { dealerId: user.id } });
        }
    }

    static async getProductById(id: string, user: { id: string; role: Role }) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw { statusCode: 404, message: 'Product not found' };
        }

        if (user.role !== Role.ADMIN && product.dealerId !== user.id) {
            throw { statusCode: 403, message: 'Forbidden' };
        }
        return product;
    }

    static async updateProduct(id: string, user: { id: string; role: Role }, data: Partial<Omit<Product, 'id' | 'dealerId'>>) {
        const product = await this.getProductById(id, user); // Checks existence and permission

        return await prisma.product.update({
            where: { id },
            data,
        });
    }

    static async deleteProduct(id: string, user: { id: string; role: Role }) {
        const product = await this.getProductById(id, user); // Checks existence and permission

        return await prisma.product.delete({
            where: { id },
        });
    }
}
